chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "extractData") {
      // Get user selection
      let selectedText = req.selected || window.getSelection().toString();
  
      // Find Booking ID text after <b>Booking ID:</b>
      let bookingElement = [...document.querySelectorAll("b")]
        .find(b => b.innerText.includes("Booking ID"));
      
      let bookingId = null;
      if (bookingElement && bookingElement.nextSibling) {
        bookingId = bookingElement.nextSibling.textContent.trim();
      }
  
      sendResponse({ selectedText, bookingId });
    }
  
    if (req.action === "pasteText") {
      // Fill contact number
      let input = document.querySelector("input[name='contact_number']");
      if (input && req.number) {
        input.value = req.number;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
  
      // Fill booking id into #textNotes
      setTimeout(() => {
        let notes = document.querySelector("#textNotes");
        if (notes && req.bookingId) {
          notes.value = req.bookingId;
          notes.dispatchEvent(new Event("input", { bubbles: true }));
        }  
        
        // Click Notes Submit button
        let notesBtn = document.querySelector("#notessubmit");
        if (notesBtn) notesBtn.click();

        // Click Accept button

            let acceptBtn = document.querySelector("button.button555.acceptVCbtn");
            if (acceptBtn) acceptBtn.click();
      }, 5000);

  
      // Click Call button
      let callBtn = document.querySelector("button.directQuickCallSubmit");
      if (callBtn) callBtn.click();
  
  
      let acceptBtn = document.querySelector("button.acceptVCbtn");
      if (acceptBtn) acceptBtn.click();
      
      sendResponse({ status: "done" });
    }
  });
  