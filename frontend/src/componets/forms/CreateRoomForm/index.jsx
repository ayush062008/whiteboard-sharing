import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { v4 as generateUUID } from "uuid";

const CreateRoomForm = ({ socket, setUser }) => {
  const [roomId, setRoomId] = useState(() => generateUUID());
  const [name, setName] = useState("");

  const navigate = useNavigate();

  const handleGenerate = () => {
    setRoomId(generateUUID());
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    const roomData = {
      name: name.trim(),
      roomId,
      userId: generateUUID(),
      host: true,
      presenter: true,
    };

    setUser(roomData);

    socket.emit("userJoined", roomData);
    navigate(`/${roomId}`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      alert("Room code copied!");
    } catch {
      alert("Failed to copy");
    }
  };

  return (
    <form className="form col-md-10 mt-4" onSubmit={handleCreateRoom}>
      <div className="form-group">
        <input
          type="text"
          className="form-control my-2"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-group border">
        <div className="input-group d-flex align-items-center justify-content-between">
          <input
            type="text"
            value={roomId}
            className="form-control my-2 border-0"
            disabled
          />

          <div className="input-group-append">
            <button
              type="button"
              className="btn btn-primary btn-sm me-1"
              onClick={handleGenerate}
            >
              Generate
            </button>

            <button
              type="button"
              className="btn btn-outline-danger btn-sm me-2"
              onClick={handleCopy}
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <button type="submit" className="mt-4 btn btn-primary w-100">
        Generate Room
      </button>
    </form>
  );
};

export default CreateRoomForm;