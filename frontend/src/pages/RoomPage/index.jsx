import { useRef, useState,useEffect } from "react";
import { useParams } from "react-router-dom";
import "./index.css";
import Whiteboard from "../../componets/whiteboard";
import Chat from "../../componets/ChatBar";
const TOOLS = [
  { label: "Pencil", value: "pencil" },
  { label: "Line", value: "line" },
  { label: "Rectangle", value: "rect" },
]; 

const RoomPage = ({ user , socket,users}) => {
  const{roomId} = useParams();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");

  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
const [openedUserTab,setOpenUserTab] =useState(false);
const [OpenedChatTab,setOpenedChatTab] =useState(false);
useEffect(()=>{
  return () =>{
    socket.emit("userLeft",user);

  };
})
  // =====================
  // UNDO
  // =====================
  const handleUndo = () => {
    if (elements.length === 0) return;

    const last = elements[elements.length - 1];
    setHistory(prev => [...prev, last]);
    setElements(prev => prev.slice(0, -1));
  };

  // =====================
  // REDO
  // =====================
  const handleRedo = () => {
    if (history.length === 0) return;

    const last = history[history.length - 1];
    setElements(prev => [...prev, last]);
    setHistory(prev => prev.slice(0, -1));
  };

  // =====================
  // CLEAR
  // =====================
  const handleClearCanvas = () => {
    setElements([]);
    setHistory([]);
  };

  return (
    <div className="row">
     <button
  type="button"
  className="btn btn-dark"
  style={{
    display: "block",
    position: "absolute",
    top: "5%",
    left: "5%",
    height: "40px",
    width: "100px"
  }}
  onClick={() => setOpenUserTab(true)}
>
  Users
</button>
   <button
  type="button"
  className="btn btn-primary"
  style={{
    display: "block",
    position: "absolute",
    top: "15%",
    left: "5%",
    height: "40px",
    width: "100px"
  }}
  onClick={() => setOpenedChatTab(true)}
>
chats
</button>
{openedUserTab && (
  <div
    className="position-fixed top-0  h-100 text-white bg-dark"
    style={{ width: "250px",left:0 }}
  >
   <button type="button" onClick={() => setOpenUserTab(false)}
    className="btn btn-light btn-block w-100 mt-5 ">
    close
   </button>
   <div className="w-100 mt-5 pt-5"> 

    {users.map((usr,index)=>(
      <p key={index*999} className="my-2 w-100 text-center w-100">
        {usr.name} {user && user.userId ===usr.userId && "(you)"}
        </p>
    )) }
   
    </div>
  </div>
)}
{ OpenedChatTab &&<Chat setOpenedChatTab={setOpenedChatTab} socket={socket}/>}
      <h1 className="text-center py-4">
        White Board Sharing App
        <span className="text-primary"> [Users Online:{users.length}]</span>
      </h1>

      {/* SHOW TOOLBAR ONLY IF PRESENTER */}
      {user?.presenter && (
        <>
          {/* TOOLBAR */}
          <div className="row align-items-center g-3">
            {/* Tools */}
            <div className="col-md-4 d-flex gap-3">
              {TOOLS.map(({ label, value }) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="tool"
                    checked={tool === value}
                    onChange={() => setTool(value)}
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* Color */}
            <div className="col-md-3 d-flex align-items-center gap-2">
              <label>Select color:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>

            {/* Undo / Redo */}
            <div className="col-md-3 d-flex gap-2">
              <button
                className="btn btn-primary"
                disabled={elements.length === 0}
                onClick={handleUndo}
              >
                Undo
              </button>

              <button
                className="btn btn-outline-primary"
                disabled={history.length === 0}
                onClick={handleRedo}
              >
                Redo
              </button>
            </div>

            {/* Clear */}
            <div className="col-md-2">
              <button
                className="btn btn-danger w-100"
                onClick={handleClearCanvas}
              >
                Clear Canvas
              </button>
            </div>
          </div>
        </>
      )}

      {/* CANVAS */}
      <div className="col-md-10 canvas-box mt-4">
        <Whiteboard
          canvasRef={canvasRef}
          ctxRef={ctxRef}
          tool={tool}
          color={color}
          elements={elements}
          setElements={setElements}
          user={user}
          socket={socket}
          roomId={roomId}

        />
      </div>
    </div>
  );
};

export default RoomPage;
