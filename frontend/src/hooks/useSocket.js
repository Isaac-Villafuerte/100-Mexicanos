import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// const SOCKET_URL = 'http://localhost:3000';
const SOCKET_URL = 'https://100mexicanos.xido.app';

export function useSocket(gameId, role = 'viewer') {
  const [gameState, setGameState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!gameId) return;

    // Create socket connection
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Join game room
      socket.emit('JOIN_GAME', { gameId, role });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('GAME_STATE_UPDATED', (state) => {
      console.log('Game state updated:', state);
      setGameState(state);
    });

    socket.on('ERROR', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [gameId, role]);

  const emit = (event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    gameState,
    isConnected,
    emit,
    socket: socketRef.current
  };
}
