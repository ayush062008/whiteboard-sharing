import { useEffect, useRef, useState } from "react";

const Whiteboard = ({
  canvasRef,
  ctxRef,
  tool,
  color,
  elements,
  setElements,
  user,
  socket,
  roomId,
}) => {

  // =============================
  // STATES & REFS
  // =============================
  const [img, setImg] = useState(null);

  const drawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const pointsRef = useRef([]);
  const emitTimeout = useRef(null);

  // =====================================================
  // ✅ REQUEST BOARD WHEN VIEWER JOINS
  // =====================================================
  useEffect(() => {
    if (!socket || !roomId) return;

    // viewer asks server for latest board
    socket.emit("getWhiteboardData", { roomId });

  }, [socket, roomId]);

  // =====================================================
  // RECEIVE BOARD IMAGE
  // =====================================================
  useEffect(() => {
    const handler = (data) => {
      if (data?.imgURL) {
        setImg(data.imgURL);
      }
    };

    socket.on("whiteboardDataResponse", handler);

    return () => {
      socket.off("whiteboardDataResponse", handler);
    };
  }, [socket]);

  // =====================================================
  // CANVAS SETUP (PRESENTER ONLY)
  // =====================================================
  useEffect(() => {
    if (!user?.presenter) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const WIDTH = 900;
    const HEIGHT = 400;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = WIDTH * ratio;
    canvas.height = HEIGHT * ratio;

    canvas.style.width = WIDTH + "px";
    canvas.style.height = HEIGHT + "px";

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctxRef.current = ctx;

    // send blank board once
    setTimeout(() => {
      const canvasImage = canvas.toDataURL("image/png");

      socket.emit("whiteboardData", {
        roomId,
        imgURL: canvasImage,
      });
    }, 300);

  }, [user, socket, roomId]);

  // =====================================================
  // DRAW ELEMENT
  // =====================================================
  const drawElement = (ctx, el) => {
    ctx.strokeStyle = el.color;
    ctx.beginPath();

    if (el.tool === "pencil") {
      el.points.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
      );
      ctx.stroke();
    }

    if (el.tool === "line") {
      ctx.moveTo(el.start.x, el.start.y);
      ctx.lineTo(el.end.x, el.end.y);
      ctx.stroke();
    }

    if (el.tool === "rect") {
      ctx.strokeRect(
        el.start.x,
        el.start.y,
        el.end.x - el.start.x,
        el.end.y - el.start.y
      );
    }
  };

  // =====================================================
  // REDRAW + SHARE BOARD
  // =====================================================
  useEffect(() => {
    if (!ctxRef.current || !user?.presenter) return;

    const ctx = ctxRef.current;

    ctx.clearRect(0, 0, 900, 400);
    elements.forEach((el) => drawElement(ctx, el));

    clearTimeout(emitTimeout.current);

    emitTimeout.current = setTimeout(() => {
      const canvasImage = canvasRef.current.toDataURL("image/png");

      socket.emit("whiteboardData", {
        roomId,
        imgURL: canvasImage,
      });
    }, 120);

  }, [elements, roomId, user, socket]);

  // =====================================================
  // VIEWER MODE
  // =====================================================
  if (!user?.presenter) {
    return (
      <div className="border border-dark border-3 h-100 w-100">
        {img ? (
          <img
            src={img}
            alt="shared whiteboard"
            className="w-100 h-100"
          />
        ) : (
          <div className="d-flex justify-content-center align-items-center h-100">
            Waiting for presenter...
          </div>
        )}
      </div>
    );
  }

  // =====================================================
  // MOUSE EVENTS
  // =====================================================
  const handleMouseDown = (e) => {
    drawingRef.current = true;
    const { offsetX, offsetY } = e.nativeEvent;

    startPosRef.current = { x: offsetX, y: offsetY };
    pointsRef.current = [{ x: offsetX, y: offsetY }];
  };

  const handleMouseMove = (e) => {
    if (!drawingRef.current) return;

    const ctx = ctxRef.current;
    const { offsetX, offsetY } = e.nativeEvent;

    ctx.clearRect(0, 0, 900, 400);
    elements.forEach((el) => drawElement(ctx, el));

    ctx.strokeStyle = color;

    if (tool === "pencil") {
      pointsRef.current.push({ x: offsetX, y: offsetY });

      ctx.beginPath();
      pointsRef.current.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
      );
      ctx.stroke();
    }

    if (tool === "line") {
      ctx.beginPath();
      ctx.moveTo(startPosRef.current.x, startPosRef.current.y);
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    }

    if (tool === "rect") {
      ctx.strokeRect(
        startPosRef.current.x,
        startPosRef.current.y,
        offsetX - startPosRef.current.x,
        offsetY - startPosRef.current.y
      );
    }
  };

  const handleMouseUp = (e) => {
    if (!drawingRef.current) return;

    drawingRef.current = false;
    const { offsetX, offsetY } = e.nativeEvent;

    let newElement;

    if (tool === "pencil") {
      newElement = { tool, color, points: pointsRef.current };
    } else {
      newElement = {
        tool,
        color,
        start: startPosRef.current,
        end: { x: offsetX, y: offsetY },
      };
    }

    setElements((prev) => [...prev, newElement]);
  };

  // =====================================================
  // CANVAS
  // =====================================================
  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="border border-dark border-3"
    />
  );
};

export default Whiteboard;