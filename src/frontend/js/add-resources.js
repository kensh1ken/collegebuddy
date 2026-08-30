const API = (() => {
    const host = window.location.hostname;
    return host === "localhost"
        ? "http://localhost:3000"
        : "http://127.0.0.1:3000";
})();

const form = document.getElementById("resourceForm");

const fileSection =
    document.getElementById("fileSection");

const linkSection =
    document.getElementById("linkSection");

const fileInput =
    document.getElementById("resourceFile");

const externalLink =
    document.getElementById("externalLink");

const message =
    document.getElementById("message");

const submitBtn =
    document.getElementById("submitBtn");


// ============================
// CHANGE RESOURCE TYPE
// ============================

const typeInputs =
    document.querySelectorAll(
        'input[name="resourceType"]'
    );


typeInputs.forEach(input => {

    input.addEventListener("change", () => {

        if (input.value === "file" && input.checked) {

            fileSection.classList.remove("hidden");

            linkSection.classList.add("hidden");

            fileInput.required = true;

            externalLink.required = false;

        }


        if (input.value === "link" && input.checked) {

            fileSection.classList.add("hidden");

            linkSection.classList.remove("hidden");

            fileInput.required = false;

            externalLink.required = true;

        }

    });

});


// ============================
// SUBMIT
// ============================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    message.textContent = "";

    submitBtn.disabled = true;

    submitBtn.textContent = "Uploading...";


    const title =
        document.getElementById("title").value.trim();

    const description =
        document.getElementById("description").value.trim();

    const courseId =
        document.getElementById("courseId").value.trim();

    const semester =
        document.getElementById("semester").value;

    const resourceType =
        document.querySelector(
            'input[name="resourceType"]:checked'
        ).value;


    try {

        /*
        ========================================
        FILE RESOURCE
        ========================================
        */

        if (resourceType === "file") {

            const file = fileInput.files[0];

            if (!file) {

                throw new Error(
                    "Please select a file"
                );

            }


            const formData = new FormData();

            formData.append("title", title);

            formData.append(
                "description",
                description
            );

            formData.append(
                "courseId",
                courseId
            );

            formData.append(
                "semester",
                semester
            );

            formData.append(
                "resourceType",
                "file"
            );

            formData.append(
                "file",
                file
            );


            const response = await fetch(
                `${API}/resources`,
                {
                    method: "POST",

                    credentials: "include",

                    body: formData
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to upload resource"
                );

            }

            message.textContent =
                "Resource uploaded successfully!";

        }


        /*
        ========================================
        EXTERNAL LINK
        ========================================
        */

        else {

            if (!externalLink.value.trim()) {

                throw new Error(
                    "Please enter a link"
                );

            }


            const response = await fetch(
                `${API}/resources`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({

                        title,

                        description,

                        courseId,

                        semester,

                        resourceType: "link",

                        externalLink:
                            externalLink.value.trim()

                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to add resource"
                );

            }


            message.textContent =
                "Resource added successfully!";

        }


        /*
        ========================================
        SUCCESS
        ========================================
        */

        form.reset();

        fileSection.classList.remove("hidden");

        linkSection.classList.add("hidden");

        fileInput.required = true;

        externalLink.required = false;


        setTimeout(() => {

            window.location.href =
                "resources.html";

        }, 1000);


    } catch (err) {

        console.log(err);

        message.textContent =
            err.message;

    } finally {

        submitBtn.disabled = false;

        submitBtn.textContent =
            "Add Resource";

    }

});