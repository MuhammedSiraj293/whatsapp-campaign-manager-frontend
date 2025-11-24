import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FaCommentDots, FaListUl, FaHandPointer } from 'react-icons/fa';

const CustomNode = ({ data, isConnectable, selected }) => {
  const getIcon = () => {
    switch (data.messageType) {
      case 'buttons': return <FaHandPointer className="text-purple-400" />;
      case 'list': return <FaListUl className="text-orange-400" />;
      default: return <FaCommentDots className="text-emerald-400" />;
    }
  };

  return (
    <div className={`shadow-lg rounded-lg bg-[#202d33] border-2 min-w-[250px] ${selected ? 'border-emerald-500' : 'border-gray-700'}`}>
      {/* Header */}
      <div className="bg-[#2a3942] p-2 rounded-t-lg flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-bold text-white text-sm">{data.label}</span>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">{data.nodeId}</span>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-gray-300 text-sm line-clamp-3 whitespace-pre-wrap">{data.messageText}</p>
        
        {/* Buttons Preview with Handles */}
        {data.messageType === 'buttons' && data.buttons && data.buttons.length > 0 && (
          <div className="mt-3 space-y-2">
            {data.buttons.map((btn, i) => (
              <div key={i} className="relative">
                <div className="bg-[#2a3942] text-xs text-center py-2 px-2 rounded text-emerald-400 border border-gray-700 hover:bg-[#364852] transition-colors">
                  {btn.title}
                </div>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`handle-btn-${i}`}
                  isConnectable={isConnectable}
                  className="w-3 h-3 bg-purple-500 !right-[-18px]"
                />
              </div>
            ))}
          </div>
        )}

        {/* List Items Preview with Handles */}
        {data.messageType === 'list' && data.listItems && data.listItems.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Menu Items</div>
            {data.listItems.map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-[#2a3942] text-xs text-left py-2 px-3 rounded text-orange-400 border border-gray-700 hover:bg-[#364852] transition-colors flex justify-between items-center">
                  <span>{item.title}</span>
                </div>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`handle-list-${i}`}
                  isConnectable={isConnectable}
                  className="w-3 h-3 bg-orange-500 !right-[-18px]"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Default Handles (Left Input, Right Output for Text) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-emerald-500"
      />
      
      {/* Only show default right handle if NOT buttons or list (or if mixed, but usually exclusive) */}
      {data.messageType !== 'buttons' && data.messageType !== 'list' && (
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="w-3 h-3 bg-emerald-500"
        />
      )}
    </div>
  );
};

export default memo(CustomNode);
