chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "call-action",
      title: "Call",
      contexts: ["selection"]
    });
  

  chrome.contextMenus.create({
    id: "addToSheet",
    title: "Add to sheet",
    contexts: ["selection"]
  });
});
  
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "call-action") {
      // Step 1: Ask the CURRENT tab for selected text + booking id
      chrome.tabs.sendMessage(
        tab.id,
        { action: "extractData", selected: info.selectionText },
        async (response) => {
          if (!response) {
            console.log("No response from source tab");
            return;
          }
  
          // Step 2: Find SmartPing dashboard tab
          let [targetTab] = await chrome.tabs.query({
            url: "https://ccs.smartpingcc.io/telephony/0/dashboard*"
          });
  
          if (targetTab) {
            // Focus it
            await chrome.tabs.update(targetTab.id, { active: true });
  
            // Step 3: Send both values to SmartPing tab
            chrome.tabs.sendMessage(targetTab.id, {
              action: "pasteText",
              number: response.selectedText,
              bookingId: response.bookingId
            });
          } else {
            console.log("SmartPing tab not found. Please open the dashboard first.");
          }
        }
      );
    }
  });
  
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "callOption") {
      const phoneNumber = info.selectionText.trim();
      const targetUrl = "https://ccs.smartpingcc.io/telephony/0/dashboard";
  
      const tabs = await chrome.tabs.query({ url: targetUrl });
      if (tabs.length > 0) {
        const targetTab = tabs[0];
        await chrome.scripting.executeScript({
          target: { tabId: targetTab.id },
          func: (number) => {
            const input = document.querySelector("input[name='contact_number']");
            const button = document.querySelector(".directQuickCallSubmit");
            if (input && button) {
              input.value = number;
              button.click();
            }
          },
          args: [phoneNumber]
        });
      } else {
        chrome.tabs.create({ url: targetUrl });
      }
    }
  
    if (info.menuItemId === "addToSheet") {
      const bookingId = info.selectionText.trim();
      const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSd8p9nMrvMEXv1hHXBpT7F2bADyKezaITbHrlp3lFBdZVJMpA/viewform"; // Replace
  
      chrome.tabs.create({ url: formUrl }, async (newTab) => {
        chrome.scripting.executeScript({
          target: { tabId: newTab.id },
          func: (bookingId) => {
            const fillForm = () => {
              try {
                // ✅ 1. Check the checkbox
                const checkboxes = document.querySelector("#i5");
                if (checkboxes.length) checkboxes[0].click();
  
                // ✅ 2. Fill Booking ID
                const textInputs = document.querySelectorAll("input[type='text']");
                textInputs.forEach(input => {
                  if (input.placeholder.toLowerCase().includes("booking id")) {
                    input.value = bookingId;
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                  }
                });
  
                // ✅ 3. Select radio button “On Trip”
                const radios = document.querySelectorAll("input[type='radio']");
                radios.forEach(r => {
                  const label = r.closest("label")?.innerText || "";
                  if (label.toLowerCase().includes("on trip")) r.click();
                });
  
                // ✅ 4. Click Next
                const nextButton = [...document.querySelectorAll("div[role='button']")].find(btn => btn.innerText.toLowerCase().includes("next"));
                if (nextButton) nextButton.click();
  
                setTimeout(() => {
                  // ✅ 5. Select dropdown “Not Interested”
                  const selects = document.querySelectorAll("select");
                  selects.forEach(sel => {
                    const option = [...sel.options].find(opt => opt.text.toLowerCase().includes("not interested"));
                    if (option) sel.value = option.value;
                    sel.dispatchEvent(new Event("change", { bubbles: true }));
                  });
  
                  // ✅ 6. Check “Send me a copy...”
                  const copyCheckbox = [...document.querySelectorAll("input[type='checkbox']")].find(cb => cb.closest("label")?.innerText.toLowerCase().includes("send me a copy"));
                  if (copyCheckbox) copyCheckbox.click();
                }, 1500);
              } catch (e) {
                console.error("Form fill error", e);
              }
            };
  
            // Wait for form to load
            setTimeout(fillForm, 3000);
          },
          args: [bookingId]
        });
      });
    }
  });