"use client";

import { useEffect, useRef, useState } from "react";

interface CameraScannerProps {
  // Se invoca con el nombre del Pokémon detectado por la IA una vez
  // que el escaneo termina exitosamente.
  onScanComplete: (name: string) => void;
}

// Estados del flujo de escaneo dentro del modal
type ScanStatus = "idle" | "opening" | "ready" | "scanning" | "error";

export default function CameraScanner({ onScanComplete }: CameraScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  // Liberamos la cámara si el componente se desmonta con el modal abierto
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const handleOpen = async () => {
    setIsOpen(true);
    setStatus("opening");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("ready");
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      setStatus("error");

      // Manejo elegante de permisos denegados u otros problemas de cámara
      if (
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
      ) {
        setError(
          "Permiso de cámara denegado. Habilítalo en la configuración de tu navegador para poder escanear cartas."
        );
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError("No se encontró ninguna cámara disponible en este dispositivo.");
      } else {
        setError("No se pudo acceder a la cámara. Intenta de nuevo.");
      }
    }
  };

  const handleClose = () => {
    stopStream();
    setIsOpen(false);
    setStatus("idle");
    setError(null);
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dibujamos el frame actual del video en el canvas oculto
    ctx.drawImage(video, 0, 0, width, height);

    // Extraemos el frame como JPEG base64, quitando el prefijo "data:image/jpeg;base64,"
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const imageBase64 = dataUrl.split(",")[1];

    setStatus("scanning");
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json();

      if (!res.ok || !data.pokemonName) {
        throw new Error(data.error || "No se pudo identificar la carta");
      }

      stopStream();
      setIsOpen(false);
      setStatus("idle");
      onScanComplete(data.pokemonName);
    } catch (err) {
      console.error("Error al escanear la carta:", err);
      setStatus("ready");
      setError("No se pudo analizar la imagen. Intenta de nuevo.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-semibold transition-colors"
      >
        📷 Escanear
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-yellow-400">
                Escanear carta
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-white text-xl leading-none"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {error ? (
              <p className="text-red-400 text-center mb-4">{error}</p>
            ) : (
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Canvas oculto usado únicamente para extraer el frame capturado */}
            <canvas ref={canvasRef} className="hidden" />

            <button
              type="button"
              onClick={handleCapture}
              disabled={status !== "ready" && status !== "scanning"}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {status === "scanning"
                ? "Analizando..."
                : status === "opening"
                ? "Abriendo cámara..."
                : "Capturar"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
