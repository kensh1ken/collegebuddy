const API = window.CollegeBuddyAPI.baseUrl;

const container =
    document.getElementById("resourcesContainer");


// ============================
// FETCH RESOURCES
// ============================

async function loadResources() {

    const search =
        document.getElementById("searchInput").value.trim();

    const semester =
        document.getElementById("semesterFilter").value;

    const courseId =
        document.getElementById("courseFilter").value.trim();

    const resourceType =
        document.getElementById("typeFilter").value;


    const params = new URLSearchParams();


    if (search) {
        params.append("search", search);
    }

    if (semester) {
        params.append("semester", semester);
    }

    if (courseId) {
        params.append("courseId", courseId);
    }

    if (resourceType) {
        params.append("resourceType", resourceType);
    }


    try {

        container.innerHTML = `
            <div class="loading">
                Loading resources...
            </div>
        `;


        const response = await fetch(
            `${API}/resources?${params.toString()}`,
            {
                credentials: "include"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message || "Failed to fetch resources"
            );

        }


        displayResources(data.resources);


    } catch (err) {

        console.log(err);

        container.innerHTML = `
            <div class="empty">
                Failed to load resources.
            </div>
        `;

    }
}


// ============================
// DISPLAY RESOURCES
// ============================

function displayResources(resources) {

    container.innerHTML = "";


    document.getElementById("resultCount")
        .textContent =
        `${resources.length} resource(s)`;


    if (resources.length === 0) {

        container.innerHTML = `
            <div class="empty">
                No resources found.
            </div>
        `;

        return;
    }


    resources.forEach(resource => {

        const card =
            document.createElement("div");

        card.className = "resource-card";


        const icon =
            resource.resourceType === "file"
                ? "📄"
                : "🔗";


        const typeClass =
            resource.resourceType === "file"
                ? "file-type"
                : "link-type";


        card.innerHTML = `

            <div class="resource-icon">
                ${icon}
            </div>

            <h3>
                ${resource.title}
            </h3>

            <p class="description">
                ${resource.description || "No description"}
            </p>

            <div class="meta">

                📚 ${resource.courseId}

                <br>

                🎓 Semester ${resource.semester}

            </div>


            <div class="resource-footer">

                <span
                    class="resource-type ${typeClass}"
                >
                    ${resource.resourceType.toUpperCase()}
                </span>


                <a
                    class="view-btn"
                    href="resource.html?id=${resource._id}"
                >
                    View
                </a>

            </div>

        `;


        container.appendChild(card);

    });
}


// ============================
// SEARCH
// ============================

document
    .getElementById("searchBtn")
    .addEventListener(
        "click",
        loadResources
    );


// Search when pressing Enter

document
    .getElementById("searchInput")
    .addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                loadResources();

            }

        }
    );


// ============================
// FILTER
// ============================

document
    .getElementById("filterBtn")
    .addEventListener(
        "click",
        loadResources
    );


// ============================
// CLEAR FILTERS
// ============================

document
    .getElementById("clearBtn")
    .addEventListener(
        "click",
        () => {

            document.getElementById(
                "searchInput"
            ).value = "";

            document.getElementById(
                "semesterFilter"
            ).value = "";

            document.getElementById(
                "courseFilter"
            ).value = "";

            document.getElementById(
                "typeFilter"
            ).value = "";


            loadResources();

        }
    );


// ============================
// INITIAL LOAD
// ============================

loadResources();
