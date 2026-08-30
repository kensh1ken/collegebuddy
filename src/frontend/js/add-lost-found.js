const API = (() => {
    const host = window.location.hostname;
    return host === "localhost"
        ? "http://localhost:3000"
        : "http://127.0.0.1:3000";
})();

const form =
    document.getElementById("lostFoundForm");

const imageInput =
    document.getElementById("image");

const preview =
    document.getElementById("imagePreview");

const submitBtn =
    document.getElementById("submitBtn");

const message =
    document.getElementById("message");


// ============================
// IMAGE PREVIEW
// ============================

imageInput.addEventListener("change", () => {

    const file = imageInput.files[0];

    if (!file) {
        preview.classList.add("hidden");
        preview.innerHTML = "";
        return;
    }

    const imageURL =
        URL.createObjectURL(file);

    preview.innerHTML = `
        <img
            src="${imageURL}"
            alt="Image preview"
        >
    `;

    preview.classList.remove("hidden");

});


// ============================
// SUBMIT
// ============================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    message.textContent = "";

    submitBtn.disabled = true;

    submitBtn.textContent = "Reporting...";


    const title =
        document.getElementById("title").value.trim();

    const description =
        document.getElementById("description").value.trim();

    const category =
        document.getElementById("category").value;

    const type =
        document.querySelector(
            'input[name="type"]:checked'
        ).value;

    const location =
        document.getElementById("location").value.trim();

    const contactNumber =
        document.getElementById("contactNumber").value.trim();

    const image =
        imageInput.files[0];


    try {

        const formData = new FormData();

        formData.append("title", title);

        formData.append(
            "description",
            description
        );

        formData.append(
            "category",
            category
        );

        formData.append(
            "type",
            type
        );

        formData.append(
            "location",
            location
        );

        formData.append(
            "contactNumber",
            contactNumber
        );


        if (image) {

            formData.append(
                "image",
                image
            );

        }


        const response = await fetch(
            `${API}/lost-found`,
            {
                method: "POST",

                credentials: "include",

                body: formData
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to report item"
            );

        }


        message.textContent =
            "Item reported successfully!";


        form.reset();

        preview.classList.add("hidden");

        preview.innerHTML = "";


        setTimeout(() => {

            window.location.href =
                "lost-found.html";

        }, 1000);


    } catch (err) {

        console.error(err);

        message.textContent =
            err.message;

    } finally {

        submitBtn.disabled = false;

        submitBtn.textContent =
            "Report Item";

    }

});