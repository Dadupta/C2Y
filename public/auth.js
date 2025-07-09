firebase.auth().onAuthStateChanged(user => {
  const saveBtn = document.getElementById('save-project-btn');
  if (user) {
    saveBtn.hidden = false;
    console.log(`✅ Logged in as: ${user.displayName}`);
  } else {
    saveBtn.hidden = true;
    console.log('👤 Logged out');
  }
});

// Optional: Add login/logout buttons if you want
const login = async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await firebase.auth().signInWithPopup(provider);
  } catch (err) {
    alert('Login failed: ' + err.message);
  }
};

const logout = () => {
  firebase.auth().signOut();
};

// You can hook these to buttons if needed
// <button onclick="login()">Sign In with Google</button>
// <button onclick="logout()">Sign Out</button>
