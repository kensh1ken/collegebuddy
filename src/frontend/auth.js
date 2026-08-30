const API = (() => {
  const host = window.location.hostname;
  return host === "localhost"
    ? "http://localhost:3000/api/auth"
    : "http://127.0.0.1:3000/api/auth";
})();

const signupForm = document.getElementById("signupForm");
if(signupForm) {
  signupForm.addEventListener('submit' , async (e)=>{
    e.preventDefault();
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {
      const response = await fetch(
          `${API}/signup`,
          {
            method:"POST",
            headers:{
              "Content-Type": "application/json"
            },
            credentials: "include",
            body:JSON.stringify({
              name,
              email,
              password
            })
          }
      )
      const data = await response.json();

      if(!response.ok) {
        throw new Error(
          data.message || "signup failed"
        )
      }
      document.getElementById("message").textContent = "Account Created Successfully";

      setTimeout(()=>{
        window.location.href = "complete-profile.html";
      },1000)
    }catch(err) {
      document.getElementById("message").textContent = err.message;
    }
  })

}

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();


        const email =
            document.getElementById("loginEmail").value;

        const password =
            document.getElementById("loginPassword").value;


        try {

            const response = await fetch(
                `${API}/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message || "Login failed"
                );

            }


            document.getElementById("message").textContent =
                "Login successful!";

            if(data.profileCompleted) {
                window.location.href = "index.html";
            } else {
                window.location.href = "complete-profile.html";
            }
            


        } catch (err) {

            document.getElementById("message").textContent =
                err.message;

        }

    });

}