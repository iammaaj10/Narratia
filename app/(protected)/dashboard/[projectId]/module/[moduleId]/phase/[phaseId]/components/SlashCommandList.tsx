import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type SlashCommandListProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  command: (item: any) => void;
};

export const SlashCommandList = forwardRef((props: SlashCommandListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0);
  }, [props.items]);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  if (props.items.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="z-50 w-72 bg-slate-900 border border-purple-500/30 rounded-xl shadow-[0_10px_40px_-10px_rgba(168,85,247,0.3)] overflow-hidden backdrop-blur-md"
      >
        <div className="p-2 flex flex-col gap-1 max-h-80 overflow-y-auto custom-scrollbar">
          {props.items.map((item, index) => {
            const Icon = item.icon;
            const isSelected = index === selectedIndex;
            return (
              <button
                key={index}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left ${
                  isSelected
                    ? 'bg-purple-500/20 text-purple-100'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                onClick={() => selectItem(index)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-md ${
                    isSelected ? 'bg-purple-500/30 text-purple-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-semibold truncate">{item.title}</div>
                  <div className="text-xs text-slate-500 truncate">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

SlashCommandList.displayName = 'SlashCommandList';

export default SlashCommandList;
