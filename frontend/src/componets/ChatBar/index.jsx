import { useEffect, useRef, useState } from "react";

const Chat = ({ setOpenedChatTab, socket }) => {
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Listen for incoming messages
  useEffect(() => {
    const handleMessage = (data) => {
      setChat((prev) => [...prev, data]);
    };

    socket.on("messageResponse", handleMessage);

    return () => {
      socket.off("messageResponse", handleMessage);
    };
  }, [socket]);

  // Auto scroll to bottom when chat updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (message.trim()) {
      socket.emit("message", { message });
      setMessage("");
    }
  };

  return (
    <div
      className="position-fixed top-0 h-100 d-flex flex-column"
      style={{
        width: "400px",
        left: 0,
        background: "#1e1e2f",
      }}
    >
      {/* Header */}
      <div className="p-3 border-bottom border-secondary d-flex justify-content-between align-items-center">
        <h5 className="m-0 text-white">Chat</h5>
        <button
          onClick={() => setOpenedChatTab(false)}
          className="btn btn-sm btn-outline-light"
        >
          ✕
        </button>
      </div>

      {/* Messages Area */}
      <div
        className="flex-grow-1 p-3"
        style={{
          overflowY: "auto",
          background: "#141420",
        }}
      >
        {chat.map((msg, index) => {
          const isMe = msg.name === "You";

          return (
            <div
              key={index}
              className={`d-flex mb-2 ${
                isMe ? "justify-content-end" : "justify-content-start"
              }`}
            >
              <div
                style={{
                  maxWidth: "70%",
                  padding: "10px 14px",
                  borderRadius: "18px",
                  background: isMe ? "#4e73df" : "#2d2d44",
                  color: "white",
                  fontSize: "14px",
                }}
              >
                {!isMe && (
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      marginBottom: "4px",
                      opacity: 0.7,
                    }}
                  >
                    {msg.name}
                  </div>
                )}

                {msg.message}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-2 d-flex"
        style={{ background: "#1e1e2f" }}
      >
        <input
          type="text"
          placeholder="Type a message..."
          className="form-control me-2"
          style={{
            background: "#2d2d44",
            border: "none",
            color: "white",
            borderRadius: "20px",
          }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          type="submit"
          className="btn"
          style={{
            background: "#4e73df",
            color: "white",
            borderRadius: "20px",
            padding: "6px 16px",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;