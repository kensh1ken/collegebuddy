const API = window.CollegeBuddyAPI.baseUrl;

const usersTable =
    document.getElementById("usersTable");

const userCount =
    document.getElementById("userCount");

const searchInput =
    document.getElementById("searchUsers");

let users = [];


// ============================
// GET USERS
// ============================

async function loadUsers() {

    try {

        const response = await fetch(
            `${API}/admin/users`,
            {
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to fetch users"
            );

        }

        users = data.users || [];

        displayUsers(users);

    } catch (err) {

        console.error(err);

        usersTable.innerHTML = `
            <tr>
                <td colspan="5" class="error">
                    ${err.message}
                </td>
            </tr>
        `;

        userCount.textContent =
            "Failed to load users";
    }

}


// ============================
// DISPLAY USERS
// ============================

function displayUsers(list) {

    userCount.textContent =
        `${list.length} user(s)`;


    if (list.length === 0) {

        usersTable.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    No users found.
                </td>
            </tr>
        `;

        return;
    }


    usersTable.innerHTML = "";


    list.forEach(user => {

        const row =
            document.createElement("tr");


        const blocked =
            user.isBlocked;


        row.innerHTML = `

            <td>
                <strong>
                    ${user.name || "Unknown"}
                </strong>
            </td>


            <td>
                ${user.email}
            </td>


            <td>
                <span class="role ${user.role}">
                    ${user.role}
                </span>
            </td>


            <td>

                ${
                    blocked

                    ? `
                        <span class="status-badge blocked">
                            Blocked
                        </span>
                    `

                    : `
                        <span class="status-badge active-status">
                            Active
                        </span>
                    `
                }

            </td>


            <td>

                ${
                    user.role === "admin"

                    ? `
                        <span class="admin-text">
                            Administrator
                        </span>
                    `

                    : blocked

                    ? `
                        <button
                            class="unblock-btn"
                            onclick="unblockUser('${user._id}')"
                        >
                            Unblock
                        </button>
                    `

                    : `
                        <button
                            class="block-btn"
                            onclick="blockUser('${user._id}')"
                        >
                            Block
                        </button>
                    `
                }

            </td>

        `;


        usersTable.appendChild(row);

    });

}


// ============================
// BLOCK
// ============================

async function blockUser(id) {

    const confirmBlock =
        confirm(
            "Are you sure you want to block this user?"
        );


    if (!confirmBlock) {
        return;
    }


    try {

        const response = await fetch(
            `${API}/admin/users/${id}/block`,
            {
                method: "PATCH",
                credentials: "include"
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to block user"
            );

        }


        alert(
            "User blocked successfully."
        );


        loadUsers();

    } catch (err) {

        alert(err.message);

    }

}


// ============================
// UNBLOCK
// ============================

async function unblockUser(id) {

    try {

        const response = await fetch(
            `${API}/admin/users/${id}/unblock`,
            {
                method: "PATCH",
                credentials: "include"
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to unblock user"
            );

        }


        alert(
            "User unblocked successfully."
        );


        loadUsers();

    } catch (err) {

        alert(err.message);

    }

}


// ============================
// SEARCH
// ============================

searchInput.addEventListener(
    "input",
    () => {

        const search =
            searchInput.value
                .toLowerCase()
                .trim();


        const filtered =
            users.filter(user => {

                return (
                    user.name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    user.email
                        ?.toLowerCase()
                        .includes(search)
                );

            });


        displayUsers(filtered);

    }
);


// ============================
// INITIAL LOAD
// ============================

loadUsers();
