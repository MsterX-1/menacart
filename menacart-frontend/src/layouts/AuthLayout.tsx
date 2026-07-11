import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Logo } from '../components/Logo';
import './AuthLayout.css';

export const AuthLayout: React.FC = () => {
  // Parallax background setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 50, stiffness: 100, mass: 1 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    mouseX.set(x);
    mouseY.set(y);
  };

  const x1 = useTransform(smoothX, [-1, 1], [30, -30]);
  const y1 = useTransform(smoothY, [-1, 1], [30, -30]);

  const x2 = useTransform(smoothX, [-1, 1], [-20, 20]);
  const y2 = useTransform(smoothY, [-1, 1], [-20, 20]);

  const x3 = useTransform(smoothX, [-1, 1], [-40, 40]);
  const y3 = useTransform(smoothY, [-1, 1], [40, -40]);

  const x4 = useTransform(smoothX, [-1, 1], [15, -15]);
  const y4 = useTransform(smoothY, [-1, 1], [-15, 15]);

  return (
    <div className="auth-layout" onMouseMove={handleMouseMove}>
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <Logo />
          </div>
          <div className="auth-quote">
            <p>"Fashion is part of the daily air and it changes all the time, with all the events. You can even see the approaching of a revolution in clothes."</p>
            <span>— Diana Vreeland</span>
          </div>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-bg-shapes">
          <motion.div className="auth-shape auth-shape-1" style={{ x: x1, y: y1 }}></motion.div>
          <motion.div className="auth-shape auth-shape-2" style={{ x: x2, y: y2 }}></motion.div>
          <motion.div className="auth-shape auth-shape-3" style={{ x: x3, y: y3 }}></motion.div>
          <motion.div className="auth-shape auth-shape-4" style={{ x: x4, y: y4 }}></motion.div>
        </div>

        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
        <footer className="auth-footer">
          <p>&copy; {new Date().getFullYear()} MenaCart. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};
