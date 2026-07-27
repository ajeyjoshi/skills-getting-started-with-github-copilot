document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        if (details.participants && details.participants.length) {
          const heading = document.createElement("strong");
          heading.textContent = "Participants:";
          participantsDiv.appendChild(heading);

          const ul = document.createElement("ul");
          details.participants.forEach((p) => {
            const li = document.createElement("li");

            const badge = document.createElement("span");
            badge.className = "participant-badge";
            const initials = (p.split("@")[0] || "").split(/[^a-zA-Z0-9]/).map(s => s[0]).join("").slice(0,2).toUpperCase();
            badge.textContent = initials || p.charAt(0).toUpperCase();

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-email";
            nameSpan.textContent = p;

            li.appendChild(badge);
            li.appendChild(nameSpan);
            ul.appendChild(li);
          });

          participantsDiv.appendChild(ul);
        } else {
          const no = document.createElement("p");
          no.className = "no-participants";
          no.textContent = "No participants yet";
          participantsDiv.appendChild(no);
        }

        activityCard.appendChild(participantsDiv);

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
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Optimistically update the activity card in the DOM
        try {
          updateActivityCard(activity, email);
        } catch (err) {
          console.warn("Optimistic DOM update failed, will refetch activities", err);
        }

        // Refresh the activities list so participants and availability update
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Update a single activity card in the DOM (optimistic update)
  function updateActivityCard(activityName, email) {
    // Find card by matching the h4 title text
    const cards = Array.from(activitiesList.querySelectorAll('.activity-card'));
    const card = cards.find(c => {
      const h = c.querySelector('h4');
      return h && h.textContent.trim() === activityName;
    });

    if (!card) return;

    // Update participants section
    const participantsDiv = card.querySelector('.participants');
    if (!participantsDiv) return;

    const existingNo = participantsDiv.querySelector('.no-participants');
    if (existingNo) {
      existingNo.remove();
      const heading = document.createElement('strong');
      heading.textContent = 'Participants:';
      participantsDiv.appendChild(heading);
      const ul = document.createElement('ul');
      participantsDiv.appendChild(ul);
    }

    let ul = participantsDiv.querySelector('ul');
    if (!ul) {
      ul = document.createElement('ul');
      participantsDiv.appendChild(ul);
    }

    // Create new list item for the participant
    const li = document.createElement('li');
    const badge = document.createElement('span');
    badge.className = 'participant-badge';
    const initials = (email.split('@')[0] || '').split(/[^a-zA-Z0-9]/).map(s => s[0]).join('').slice(0,2).toUpperCase();
    badge.textContent = initials || email.charAt(0).toUpperCase();
    const nameSpan = document.createElement('span');
    nameSpan.className = 'participant-email';
    nameSpan.textContent = email;
    li.appendChild(badge);
    li.appendChild(nameSpan);
    ul.appendChild(li);

    // Update availability display (decrement spots left if present)
    const availabilityP = Array.from(card.querySelectorAll('p')).find(p => p.textContent.includes('Availability:'));
    if (availabilityP) {
      const match = availabilityP.textContent.match(/(\d+) spots left/);
      if (match) {
        const spots = Math.max(0, parseInt(match[1], 10) - 1);
        availabilityP.innerHTML = `<strong>Availability:</strong> ${spots} spots left`;
      }
    }
  }

  // Initialize app
  fetchActivities();
});
