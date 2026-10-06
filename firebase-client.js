const SDK_VERSION = '12.19.0';
const SDK_ROOT = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;

const firebaseConfig = {
  apiKey: 'AIzaSyA5SITt0xgEkMlZELH0THyJfGSa9XdzX1g',
  authDomain: 'challange-arc.firebaseapp.com',
  projectId: 'challange-arc',
  storageBucket: 'challange-arc.firebasestorage.app',
  messagingSenderId: '131232259314',
  appId: '1:131232259314:web:ea26f9348d51434fa6046b',
};

function emit(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function userSummary(user) {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
  };
}

function authErrorMessage(error) {
  const code = String(error?.code || '');
  if (code === 'auth/unauthorized-domain') {
    return 'This site domain is not authorized in Firebase Authentication yet. Add the exact hostname in Firebase Console and try again.';
  }
  if (code === 'auth/popup-blocked') return 'Your browser blocked the sign-in window. Allow pop-ups for this site, or try again on your phone.';
  if (code === 'auth/popup-closed-by-user') return 'The Google sign-in window was closed before sign-in finished.';
  if (code === 'auth/network-request-failed') return 'Sign-in needs an internet connection. Please reconnect and try again.';
  if (code === 'auth/web-storage-unsupported') return 'This browser is blocking sign-in storage. Allow site data/cookies for Daymark and try again.';
  if (code === 'auth/operation-not-supported-in-this-environment') return 'This browser could not open Google sign-in. Reopen Daymark in Chrome or Safari and try again.';
  if (code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled for this Firebase project yet.';
  return 'Google sign-in could not be completed. Please try again.';
}

async function initializeDaymarkFirebase() {
  try {
    const [appSdk, authSdk, firestoreSdk] = await Promise.all([
      import(`${SDK_ROOT}/firebase-app.js`),
      import(`${SDK_ROOT}/firebase-auth.js`),
      import(`${SDK_ROOT}/firebase-firestore.js`),
    ]);

    const app = appSdk.initializeApp(firebaseConfig);
    const auth = authSdk.getAuth(app);
    try {
      // Keep Google sign-in across redirects and installed-PWA restarts.
      await authSdk.setPersistence(auth, authSdk.browserLocalPersistence);
    } catch (error) {
      console.warn('Daymark could not use local sign-in persistence; trying session persistence.', error);
      try {
        await authSdk.setPersistence(auth, authSdk.browserSessionPersistence);
      } catch (sessionError) {
        console.warn('Daymark could not persist sign-in in this browser.', sessionError);
      }
    }
    let db;
    try {
      db = firestoreSdk.initializeFirestore(app, {
        localCache: firestoreSdk.persistentLocalCache({
          tabManager: firestoreSdk.persistentMultipleTabManager(),
        }),
      });
    } catch (error) {
      console.warn('Daymark is using Firestore memory cache in this browser.', error);
      try {
        db = firestoreSdk.initializeFirestore(app, {
          localCache: firestoreSdk.persistentLocalCache({
            tabManager: firestoreSdk.persistentSingleTabManager(),
          }),
        });
      } catch (_) {
        db = firestoreSdk.getFirestore(app);
      }
    }

    const userDocument = (uid) => firestoreSdk.doc(db, 'users', uid);
    const assertCurrentUser = (uid) => {
      if (auth.currentUser?.uid === uid) return;
      const error = new Error('This Daymark account is no longer signed in.');
      error.code = 'permission-denied';
      throw error;
    };

    async function signInWithGoogle() {
      try {
        const provider = new authSdk.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const installedPwa = window.matchMedia('(display-mode: standalone)').matches
          || navigator.standalone === true;
        const iosHomeScreenApp = installedPwa
          && (navigator.standalone === true || /iPhone|iPad|iPod/i.test(navigator.userAgent));
        // On GitHub Pages, redirect sign-in can lose Firebase's third-party
        // helper storage. Use a user-initiated popup by default; iOS home-screen
        // apps use redirect because iOS cannot reliably keep a popup attached.
        if (iosHomeScreenApp) {
          await authSdk.signInWithRedirect(auth, provider);
          return;
        }
        try {
          await authSdk.signInWithPopup(auth, provider);
        } catch (error) {
          if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/web-storage-unsupported'].includes(error?.code)) {
            await authSdk.signInWithRedirect(auth, provider);
            return;
          }
          throw error;
        }
      } catch (error) {
        error.daymarkMessage = authErrorMessage(error);
        throw error;
      }
    }

    function subscribeUserState(uid, onValue, onError) {
      assertCurrentUser(uid);
      const reference = userDocument(uid);
      return firestoreSdk.onSnapshot(reference, { includeMetadataChanges: true }, (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : {};
        onValue({
          exists: snapshot.exists(),
          state: data.state || null,
          updatedAtMs: Number(data.updatedAtMs) || 0,
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
        });
      }, onError);
    }

    async function saveUserState(uid, state, updatedAtMs) {
      assertCurrentUser(uid);
      const reference = userDocument(uid);
      const timestamp = Math.max(0, Number(updatedAtMs) || 0);
      return firestoreSdk.runTransaction(db, async (transaction) => {
        assertCurrentUser(uid);
        const current = await transaction.get(reference);
        const currentData = current.exists() ? current.data() : null;
        const remoteUpdatedAt = Number(currentData?.updatedAtMs) || 0;
        if (currentData && remoteUpdatedAt >= timestamp) {
          return {
            accepted: false,
            remote: {
              state: currentData.state || null,
              updatedAtMs: remoteUpdatedAt,
            },
          };
        }
        transaction.set(reference, {
          schemaVersion: 1,
          state,
          updatedAtMs: timestamp,
          updatedAt: firestoreSdk.serverTimestamp(),
        });
        return { accepted: true };
      });
    }

    window.DaymarkFirebase = {
      signInWithGoogle,
      signOut: () => authSdk.signOut(auth),
      subscribeUserState,
      saveUserState,
    };
    window.dispatchEvent(new Event('daymark:firebase-ready'));

    let redirectResultResolved = false;
    let observedUser = auth.currentUser;
    const publishAuthState = (user) => {
      const detail = { initialized: true, user: userSummary(user) };
      window.DaymarkFirebaseState = detail;
      emit('daymark:auth-state', detail);
    };

    authSdk.onAuthStateChanged(auth, (user) => {
      observedUser = user;
      // Hold the initial signed-out state until Firebase checks a pending OAuth redirect.
      if (user || redirectResultResolved) publishAuthState(user);
    }, (error) => {
      redirectResultResolved = true;
      publishAuthState(auth.currentUser || observedUser);
      emit('daymark:auth-error', { code: error?.code, message: authErrorMessage(error) });
    });

    authSdk.getRedirectResult(auth).then((result) => {
      redirectResultResolved = true;
      // Explicitly publish the redirect user as well as listening for auth-state
      // changes, so a PWA does not stay on the sign-in gate if that event is late.
      publishAuthState(result?.user || auth.currentUser || observedUser);
    }).catch((error) => {
      redirectResultResolved = true;
      publishAuthState(auth.currentUser || observedUser);
      emit('daymark:auth-error', { code: error?.code, message: authErrorMessage(error) });
    });
  } catch (error) {
    console.error('Daymark Firebase could not initialize.', error);
    const detail = { initialized: true, user: null };
    window.DaymarkFirebaseState = detail;
    emit('daymark:auth-state', detail);
    emit('daymark:auth-error', {
      code: error?.code || 'firebase/init-failed',
      message: 'Secure sign-in could not load. Check your internet connection and reload the page.',
    });
  }
}

void initializeDaymarkFirebase();
