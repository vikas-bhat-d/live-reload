const socket = new WebSocket('ws://localhost:3000');

socket.onopen = function(event) {
    console.log('WebSocket connection opened');
};

socket.onmessage = function(event) {
    console.log('Message from server:', event.data);
    if (event.data === 'reload') {
        window.location.reload();
    }
};

socket.onclose = function(event) {
    console.log('WebSocket connection closed');
};

socket.onerror = function(error) {
    console.error('WebSocket error:', error);
};
