import { useEffect } from 'react';
import '@toast-ui/chart/dist/toastui-chart.min.css';
import { PieChart } from '@toast-ui/react-chart';
import useOutsideClick from './useOutsideClick';

export default function Modal({ forwardRef, data, options, onClose }) {
  useEffect(() => {
      document.body.style.pointerEvents = 'none';
      if(forwardRef.current)
        forwardRef.current.style.pointerEvents = 'auto';
      return (() => {
        document.body.style.pointerEvents = 'auto';
      });
  }, [forwardRef]);

  useOutsideClick(forwardRef, onClose);

  return (
    <div id="chart" ref={forwardRef}>
      <PieChart data={data} options={options} />
    </div>
  )
}
