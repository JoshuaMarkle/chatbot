<p align="center"><img width=64 src="./public/uva_icon.png"/></p>

<h1 align="center">UVA Chatbot</h1>
<p align="center"><i>A chatbot designed for the UVA Career Center</i></p>

<https://github.com/user-attachments/assets/4d544f47-9cc2-4ff5-a436-59ed6ec51705>

## How It Works

The site is built with **Next.js** and consists of a single page. When a user sends a message, it triggers a **POST request** to `api/chat`.
This request is handled by `route.js`, which connects to **Gemini**, streams the response, and sends it back to the user in real time.

```
src
├── app
│   ├── api
│   │   └── chat
│   │       └── route.js
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
├── components
│   └── Loader.jsx
└── lib
    └── utils.js
```

## To-Do List

Currently, the model sends a single request without maintaining context. The following improvements are planned:

* **Integrate RAG (Retrieval-Augmented Generation):** Use a document store like **Pinecone** to provide contextual responses.
* **Add Pricing Estimates:** Build a pricing table to calculate and display usage-based costs.
* **Select Hosting Provider:** Research and choose a reliable and scalable hosting solution.
* **Domain Integration:** Connect the app to the **UVA Career Center** domain for deployment.
