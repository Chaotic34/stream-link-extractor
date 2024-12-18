let selectedElement = null;

document.getElementById('extract-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: enableElementSelection,
    },
    () => {
      document.getElementById('status').textContent = 'Hover and click an element to extract links.';
    }
  );
});

function enableElementSelection() {
  // Add hover effect CSS
  const hoverStyle = document.createElement('style');
  hoverStyle.innerHTML = `
    .highlight-hover {
      outline: 3px solid red;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
    }

    .highlight-slider {
      outline: 3px solid blue;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(0, 0, 255, 0.5);
    }

    .slider-container {
      position: absolute;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px;
      display: none;
      z-index: 9999;
      border-radius: 5px;
      top: 10px;
      left: 10px;
    }

    .slider-container input {
      width: 100%;
      margin-top: 10px;
    }

    .slider-container button {
      background-color: green;
      color: white;
      padding: 5px 10px;
      margin-top: 10px;
      cursor: pointer;
    }

    .cancel-button {
      background-color: red;
      padding: 5px 10px;
      color: white;
      margin-top: 10px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(hoverStyle);

  // Add mouseover and click event listeners
  document.body.addEventListener('mouseover', highlightElement);
  document.body.addEventListener('click', selectElement);

  function highlightElement(event) {
    const target = event.target;
    // Only apply the highlight if the target is an element that can be interacted with
    if (target.tagName === 'A' || target.closest('div')) {
      // Remove previous highlights
      document.querySelectorAll('.highlight-hover').forEach((el) => el.classList.remove('highlight-hover'));
      // Add highlight to the current element
      target.classList.add('highlight-hover');
    }
  }

  function selectElement(event) {
    event.preventDefault();
    event.stopPropagation();

    const container = event.target.closest('div'); // Look for closest div element (container)
    if (!container) return;

    // Highlight the first selected element in red
    selectedElement = container;
    selectedElement.classList.add('highlight-hover');

    // Create and show the slider container
    const sliderContainer = document.createElement('div');
    sliderContainer.classList.add('slider-container');
    document.body.appendChild(sliderContainer);

    // Get all child elements (subdivisions) within the selected container
    const subdivisions = Array.from(container.children);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = subdivisions.length - 1;
    slider.value = 0;
    slider.step = 1;
    slider.addEventListener('input', updateSelection);

    // Create the "Accept" button
    const acceptButton = document.createElement('button');
    acceptButton.textContent = 'Accept';
    acceptButton.addEventListener('click', () => {
      extractLinks(subdivisions[slider.value]);
      sliderContainer.remove(); // Remove slider container
      resetSelection(); // Reset highlights
    });

    // Create the "Cancel" button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.classList.add('cancel-button');
    cancelButton.addEventListener('click', () => {
      sliderContainer.remove(); // Remove slider container
      resetSelection(); // Reset highlights
    });

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(acceptButton);
    sliderContainer.appendChild(cancelButton);

    // Show the slider container
    sliderContainer.style.display = 'block';

    // Update the selection based on the slider value
    function updateSelection() {
      const selectedSubdiv = subdivisions[slider.value];
      // Remove previous blue highlights
      subdivisions.forEach((subdiv) => subdiv.classList.remove('highlight-slider'));
      // Add blue highlight to the selected subdivision
      selectedSubdiv.classList.add('highlight-slider');
    }

    // Remove the hover and click listeners after selection
    document.body.removeEventListener('mouseover', highlightElement);
    document.body.removeEventListener('click', selectElement);
  }

  function extractLinks(selectedSubdiv) {
    const links = Array.from(selectedSubdiv.querySelectorAll('a')).map((a) => a.href);
    if (links.length > 0) {
      // Copy the links to the clipboard
      navigator.clipboard.writeText(links.join('\n'));
      alert('Links copied to clipboard!');
      
      // Ask whether to open the links automatically
      const openLinks = confirm("Do you want to open these links in new tabs?");

      // If the user accepts, open each link in a new tab
      if (openLinks) {
        links.forEach(link => {
          window.open(link, '_blank');
        });
      }
    } else {
      alert('No links found in the selected element.');
    }
  }

  function resetSelection() {
    // Remove all highlights (both red and blue)
    document.querySelectorAll('.highlight-hover').forEach((el) => el.classList.remove('highlight-hover'));
    document.querySelectorAll('.highlight-slider').forEach((el) => el.classList.remove('highlight-slider'));
  }
}
