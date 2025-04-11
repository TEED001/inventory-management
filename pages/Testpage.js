import { useState, useRef } from 'react';
import Layout from '@/components/Layout';

const SpinTheWheel = () => {
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef(null);

  // Simplified options without images to prevent loading issues
  const options = [
    { id: 1, text: 'Si Popoy ay yayaman', color: 'bg-red-500' },
    { id: 2, text: 'Si Milo ay yayaman din', color: 'bg-blue-500' },
    { id: 3, text: 'Si Juvy ay maging hacker', color: 'bg-green-500' },
    { id: 4, text: 'Si Nazef ay maging Skibidi sigma king', color: 'bg-yellow-500' },
  ];

  const spinWheel = () => {
    if (spinning) return;
    
    setSpinning(true);
    setWinner(null);
    
    const spins = 5 + Math.floor(Math.random() * 5);
    const segmentAngle = 360 / options.length;
    const winningSegment = Math.floor(Math.random() * options.length);
    const newRotation = 360 * spins + winningSegment * segmentAngle;
    
    setRotation(prev => prev + newRotation);
    
    setTimeout(() => {
      setWinner(options[winningSegment]);
      setSpinning(false);
    }, 5000);
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900 p-4">
        <h1 className="text-4xl font-bold mb-8 text-white">SPIN THE WHEEL!</h1>
        
        {/* Wheel Container */}
        <div className="relative w-80 h-80 mb-12">
          {/* Wheel */}
          <div
            ref={wheelRef}
            className="w-full h-full rounded-full border-8 border-white/20 shadow-2xl transition-transform duration-5000 ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              background: `conic-gradient(
                ${options.map((opt, i) => 
                  `${opt.color} ${(360/options.length)*i}deg ${(360/options.length)*(i+1)}deg`
                ).join(', ')}
              )`
            }}
          >
            {/* Wheel Labels */}
            {options.map((option, index) => {
              const angle = (360 / options.length) * index + (360 / options.length / 2);
              const radian = angle * (Math.PI / 180);
              const radius = 120;
              const x = 50 + radius * Math.cos(radian);
              const y = 50 + radius * Math.sin(radian);
              
              return (
                <div
                  key={option.id}
                  className="absolute text-white font-bold text-sm text-center"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                    width: '90px',
                    textShadow: '0 0 5px rgba(0,0,0,0.8)'
                  }}
                >
                  {option.text.split(' ').map((word, i) => (
                    <div key={i} className="whitespace-nowrap">{word}</div>
                  ))}
                </div>
              );
            })}
            
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 w-16 h-16 -mt-8 -ml-8 bg-white/20 backdrop-blur-md rounded-full z-10 flex items-center justify-center shadow-lg border border-white/30">
              <div className="w-10 h-10 bg-purple-600/80 rounded-full"></div>
            </div>
          </div>
          
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -ml-4 w-0 h-0 
              border-l-8 border-r-8 border-b-16 border-l-transparent border-r-transparent border-b-red-500 
              transform -translate-y-2 z-20"></div>
        </div>
        
        {/* Spin Button */}
        <button
          onClick={spinWheel}
          disabled={spinning}
          className={`px-8 py-3 rounded-full text-white font-bold text-lg shadow-lg transition-all
            ${spinning ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          {spinning ? 'SPINNING...' : 'SPIN'}
        </button>
        
        {/* Result display */}
        {winner && (
          <div className={`mt-8 p-6 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white text-center w-full max-w-md`}>
            <h2 className="text-2xl font-bold mb-2">CONGRATULATIONS!</h2>
            <p className="text-xl font-semibold">{winner.text}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SpinTheWheel;