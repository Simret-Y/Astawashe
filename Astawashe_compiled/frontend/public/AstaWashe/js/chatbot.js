// const AI_API_URL = 'http://localhost:8080/api/chat';

// function waitForElements(selectors, timeout = 5000) {
//     return new Promise((resolve) => {
//         const start = Date.now();

//         function findElements() {
//             const elements = selectors.map((selector) => document.querySelector(selector));
//             if (elements.every((el) => el !== null)) {
//                 resolve(elements);
//                 return;
//             }
//             if (Date.now() - start > timeout) {
//                 resolve(elements);
//                 return;
//             }
//             requestAnimationFrame(findElements);
//         }

//         findElements();
//     });
// }

// function addMessage(chatBody, content, type) {
//     const message = document.createElement('div');
//     message.className = `chatbot-message ${type}`;
//     message.textContent = content;
//     chatBody.appendChild(message);
//     chatBody.scrollTop = chatBody.scrollHeight;
// }

// async function sendChat(chatInput, chatBody) {
//     const value = chatInput.value.trim();
//     if (!value) {
//         return;
//     }

//     addMessage(chatBody, value, 'user');
//     chatInput.value = '';

//     const loadingMessage = document.createElement('div');
//     loadingMessage.className = 'chatbot-message bot';
//     loadingMessage.textContent = 'AstaWashe is answering your question...';
//     chatBody.appendChild(loadingMessage);
//     chatBody.scrollTop = chatBody.scrollHeight;

//     try {
//         const response = await fetch(AI_API_URL, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ message: value }),
//         });

//         let botReply = 'Sorry, I did not get an answer. Please try again.';
//         if (response.ok) {
//             const data = await response.json();
//             botReply = data.answer || data.error || botReply;
//         } else {
//             const data = await response.json().catch(() => ({}));
//             botReply = data.error || 'AstaWashe is currently unavailable. Please try again later.';
//         }

//         loadingMessage.remove();
//         addMessage(chatBody, botReply, 'bot');
//     } catch (error) {
//         loadingMessage.remove();
//         addMessage(chatBody, 'Unable to reach the AstaWashe server. Please make sure Server2 is running.', 'bot');
//     }
// }

// waitForElements(['.chatbot-open-btn', '.chatbot-window', '.chatbot-close-btn', '.chatbot-send-btn', '.chatbot-input', '.chatbot-body'])
//     .then(([openButtonsNode, chatWindow, closeButton, sendButton, chatInput, chatBody]) => {
//         if (!openButtonsNode || !chatWindow || !closeButton || !sendButton || !chatInput || !chatBody) {
//             return;
//         }

//         const openButtons = document.querySelectorAll('.chatbot-open-btn');
//         openButtons.forEach((button) => {
//             button.addEventListener('click', function (event) {
//                 event.preventDefault();
//                 chatWindow.classList.toggle('active');
//                 chatInput.focus();
//             });
//         });

//         closeButton.addEventListener('click', function () {
//             chatWindow.classList.remove('active');
//         });

//         sendButton.addEventListener('click', function () {
//             sendChat(chatInput, chatBody);
//         });

//         chatInput.addEventListener('keydown', function (event) {
//             if (event.key === 'Enter') {
//                 event.preventDefault();
//                 sendChat(chatInput, chatBody);
//             }
//         });
//     });