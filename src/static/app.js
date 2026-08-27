document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const defaultActivityOption = '<option value="">-- Select an activity --</option>';
  let messageTimeoutId;

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    clearTimeout(messageTimeoutId);
    messageTimeoutId = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function createParticipantItem(activityName, email) {
    const participantItem = document.createElement("li");
    participantItem.className = "participant-item";

    const participantEmail = document.createElement("span");
    participantEmail.className = "participant-email";
    participantEmail.textContent = email;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "participant-remove";
    removeButton.dataset.activity = activityName;
    removeButton.dataset.email = email;
    removeButton.setAttribute("aria-label", `Remove ${email} from ${activityName}`);
    removeButton.innerHTML = "&#10005;";

    participantItem.append(participantEmail, removeButton);
    return participantItem;
  }

  function createActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const spotsLeft = details.max_participants - details.participants.length;
    activityCard.innerHTML = `
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p><strong>Schedule:</strong> ${details.schedule}</p>
      <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
      <div class="participants-section">
        <strong>Participants</strong>
        <ul class="participants-list"></ul>
      </div>
    `;

    const participantsList = activityCard.querySelector(".participants-list");

    if (details.participants.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "no-participants";
      emptyItem.textContent = "No participants yet";
      participantsList.appendChild(emptyItem);
      return activityCard;
    }

    details.participants.forEach((email) => {
      participantsList.appendChild(createParticipantItem(name, email));
    });

    return activityCard;
  }

  async function unregisterParticipant(activity, email) {
    const response = await fetch(
      `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Failed to remove participant");
    }

    return result;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = defaultActivityOption;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = createActivityCard(name, details);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove");

    if (!removeButton) {
      return;
    }

    removeButton.disabled = true;

    try {
      const result = await unregisterParticipant(removeButton.dataset.activity, removeButton.dataset.email);
      showMessage(result.message, "success");
      await fetchActivities();
    } catch (error) {
      showMessage(error.message || "Failed to remove participant.", "error");
      removeButton.disabled = false;
      console.error("Error removing participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
