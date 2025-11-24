import React from 'react';

export default function Sidebar() {
  const onDragStart = (event, nodeType, messageType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/messageType', messageType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="bg-[#111b21] p-4 border-r border-gray-800 h-full flex flex-col gap-4 w-64">
      <h3 className="text-white font-bold mb-2">Nodes Library</h3>
      <div className="text-gray-400 text-xs mb-4">Drag these nodes to the canvas</div>

      <div 
        className="bg-[#202d33] p-3 rounded border border-gray-700 cursor-grab hover:border-emerald-500 transition-colors"
        onDragStart={(event) => onDragStart(event, 'customNode', 'text')}
        draggable
      >
        <div className="font-bold text-emerald-400 mb-1">Text Message</div>
        <div className="text-xs text-gray-400">Simple text response</div>
      </div>

      <div 
        className="bg-[#202d33] p-3 rounded border border-gray-700 cursor-grab hover:border-purple-500 transition-colors"
        onDragStart={(event) => onDragStart(event, 'customNode', 'buttons')}
        draggable
      >
        <div className="font-bold text-purple-400 mb-1">Buttons</div>
        <div className="text-xs text-gray-400">Message with up to 3 buttons</div>
      </div>

      <div 
        className="bg-[#202d33] p-3 rounded border border-gray-700 cursor-grab hover:border-orange-500 transition-colors"
        onDragStart={(event) => onDragStart(event, 'customNode', 'list')}
        draggable
      >
        <div className="font-bold text-orange-400 mb-1">List Menu</div>
        <div className="text-xs text-gray-400">Menu with up to 10 options</div>
      </div>
    </div>
  );
}
