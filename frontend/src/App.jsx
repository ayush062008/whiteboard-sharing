import { Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import io from "socket.io-client";

import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import Forms from "./componets/forms";
import RoomPage from "./pages/RoomPage";

/* ==============================
   SOCKET CONNECTION
============================== */

const server = "https://whiteboard-sharing-5.onrender.com";

const connectionOptions = {
  reconnectionAttempts: Infinity,
  timeout: 1000,
  transports: ["websocket"],
};

const socket = io(server, connectionOptions);

/* ==============================
   APP COMPONENT
============================== */

const App = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);

  // ✅ UUID generator
  const uuid = () => crypto.randomUUID();

  /* ==============================
     USER JOINED LIST UPDATE
  ============================== */
  useEffect(() => {
    const handleUserJoined = (data) => {
      if (data.success) {
        setUsers(data.users);
      }
    };

    socket.on("userJoined", handleUserJoined);

    return () => {
      socket.off("userJoined", handleUserJoined);
    };
  }, []);

  /* ==============================
     USER LEFT LIST UPDATE
  ============================== */
  useEffect(() => {
    const handleUserLeft = (data) => {
      setUsers(data.users);
    };

    socket.on("userLeft", handleUserLeft);

    return () => {
      socket.off("userLeft", handleUserLeft);
    };
  }, []);

  /* ==============================
     JOIN MESSAGE BROADCAST
  ============================== */
  useEffect(() => {
    const handleUserJoinedMessage = (name) => {
      console.log(`${name} joined the room`);
      toast.info(`${name} joined the room`);
    };

    // ⚠️ must match server emit name EXACTLY
    socket.on(
      "userJoinedMessageBroadcasted",
      handleUserJoinedMessage
    );

    return () => {
      socket.off(
        "userJoinedMessageBroadcasted",
        handleUserJoinedMessage
      );
    };
  }, []);
  /* ==============================
   LEAVE MESSAGE BROADCAST
============================== */
useEffect(() => {
  const handleUserLeftMessage = (name) => {
    console.log(`${name} left the room`);
    toast.info(`${name} left the room`);
  };

  socket.on(
    "userLeftMessageBroadcasted",
    handleUserLeftMessage
  );

  return () => {
    socket.off(
      "userLeftMessageBroadcasted",
      handleUserLeftMessage
    );
  };
}, []);

  /* ==============================
     ROUTES
  ============================== */
  return (
    <div className="container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        <Route
          path="/"
          element={
            <Forms
              socket={socket}
              setUser={setUser}
              uuid={uuid}
            />
          }
        />

        <Route
          path="/:roomId"
          element={
            <RoomPage
              user={user}
              socket={socket}
              users={users}
            />
          }
        />
      </Routes>
    </div>
  );
};

export default App;
