import { useState } from "react";

import {useNavigate} from "react-router-dom";

const JoinRoomForm = ({ uuid,socket, setUser }) => {
  const [roomId, setRoomId] = useState(uuid());
  const [name, setName] = useState("");
  

const navigate = useNavigate();

  const handleRoomJoin = (e) => {
    e.preventDefault();

    const roomData = {
      name,
      roomId,
      userId: uuid(),
      host: false,
      presenter: false,
    };
setUser(roomData);
socket.emit("userJoined", roomData);
navigate(`/${roomId}`);
  
  };

  return (
    <form className="form col-md-10 mt-4">
      
      {/* Name input */}
      <div className="form-group">
        <input
          type="text"
          className="form-control my-2"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Room code input */}
      <div className="form-group">
        <input
          type="text"
          className="form-control my-2 border-0"
          placeholder="Enter room code"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
      </div>

      {/* Submit button */}
      <button
        type="submit" onClick={handleRoomJoin}
        className="mt-4 btn btn-primary w-100"
      >
        Join room
      </button>

    </form>
  );
};

export default JoinRoomForm;
