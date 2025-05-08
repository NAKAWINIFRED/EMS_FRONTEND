import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ExamInterface.module.css';
import * as faceapi from 'face-api.js';

const ExamInterface = () => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [currentSection, setCurrentSection] = useState('instructions');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [fullscreen, setFullscreen] = useState(false);
  const [timer, setTimer] = useState({
    hours: 3,
    minutes: 0,
    seconds: 0
  });
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [faceCount, setFaceCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenAttempts, setFullscreenAttempts] = useState(0);
  const [isSafeBrowser, setIsSafeBrowser] = useState(false);
  const [screenCaptureAttempts, setScreenCaptureAttempts] = useState(0);
  const [securityChecks, setSecurityChecks] = useState({
    fullscreen: false,
    singleTab: false,
    safeBrowser: false,
    noScreenCapture: false,
    noCopyPaste: true,
    noDevTools: false,
    noPrintScreen: false,
    noMultipleWindows: false
  });
  const [isReady, setIsReady] = useState(false);
  const [tabSwitchAttempts, setTabSwitchAttempts] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  // Track last focused time to detect tab switching more accurately
  const [lastFocusTime, setLastFocusTime] = useState(Date.now());
  const [violations, setViolations] = useState([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceDetectionError, setFaceDetectionError] = useState(null);
  
  const videoRef = useRef(null);
  const faceDetectionInterval = useRef(null);
  const fullscreenCheckInterval = useRef(null);
  const fullscreenLockInterval = useRef(null);
  const securityCheckInterval = useRef(null);
  const devToolsCheckInterval = useRef(null);
  const focusCheckInterval = useRef(null);
  const navigate = useNavigate();

  // Record violations for audit trail
  const recordViolation = (type) => {
    const violation = {
      type,
      timestamp: new Date().toISOString(),
    };
    console.log("Violation recorded:", violation);
    setViolations(prev => [...prev, violation]);
    setViolationCount(prev => prev + 1);
  };

  // Exam data structure
  const examData = {
    instructions: {
      title: "Exam Instructions",
      content: [
        "This is a secure examination for Clarke International University.",
        "The exam consists of three sections: A, B, and C.",
        "You must complete all sections within the allocated time.",
        "Section A contains multiple choice questions.",
        "Section B contains short answer questions.",
        "Section C requires an essay response.",
        "The exam must be taken in full-screen mode with camera monitoring.",
        "You cannot copy, paste, take screenshots, or switch tabs during this exam.",
        "Leaving the exam window will be recorded and may result in disqualification.",
        "Click 'Start Exam' when you are ready to begin. This will activate your camera."
      ]
    },
    sections: {
      A: {
        title: "Section A",
        description: "Multiple Choice Questions",
        questions: [
          {
            id: "A1",
            text: "What is the capital city of Uganda?",
            options: ["Kampala", "Nairobi", "Kigali", "Dodoma"],
            type: "multiple-choice"
          },
          {
            id: "A2",
            text: "Which of the following is NOT a programming language?",
            options: ["Python", "JavaScript", "HTML", "Java"],
            type: "multiple-choice"
          },
          {
            id: "A3",
            text: "Which of these is a fundamental principle of academic integrity?",
            options: ["Plagiarism", "Honesty", "Cheating", "Dishonesty"],
            type: "multiple-choice"
          }
        ]
      },
      B: {
        title: "Section B",
        description: "Short Answer Questions",
        questions: [
          {
            id: "B1",
            text: "Explain the difference between qualitative and quantitative research methods.",
            type: "short-answer"
          },
          {
            id: "B2",
            text: "Describe the key principles of ethical research involving human subjects.",
            type: "short-answer"
          },
          {
            id: "B3",
            text: "Explain the importance of data security in modern information systems.",
            type: "short-answer"
          }
        ]
      },
      C: {
        title: "Section C",
        description: "Essay Question",
        questions: [
          {
            id: "C1",
            text: "Discuss the impact of artificial intelligence on the future of healthcare delivery. Include ethical considerations, potential benefits, and challenges in your response.",
            type: "essay"
          }
        ]
      }
    }
  };

  // Load face detection models
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("Loading face detection models...");
        // Load models from the correct path in public directory
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/face-api-models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/face-api-models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/face-api-models')
        ]);
        console.log("Face detection models loaded successfully");
        setIsModelLoaded(true);
        setFaceDetectionError(null);
      } catch (error) {
        console.error("Error loading face detection models:", error);
        setFaceDetectionError("Failed to load face detection models. Please refresh the page.");
        recordViolation("Face detection model loading failed");
      }
    };

    loadModels();
  }, []);

  // Initialize camera with improved error handling
  const initializeCamera = async () => {
    try {
      console.log("Initializing camera...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play(); // Ensure video starts playing
        setCameraActive(true);
        console.log("Camera initialized successfully");
        
        // Start face detection after camera is ready
        if (isModelLoaded) {
          startBasicFaceDetection();
        }
      }
    } catch (err) {
      console.error("Camera error:", err);
      setFaceDetectionError("Camera access denied. Please enable camera permissions.");
      recordViolation("Camera access denied");
      alert("Camera access is required for this exam. Please enable camera permissions and refresh the page.");
    }
  };

  // Check for safe browser environment
  const checkSafeBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg');
    const isFirefox = userAgent.includes('firefox');
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    
    if (!isChrome && !isFirefox && !isSafari) {
      alert("Please use a supported browser (Chrome, Firefox, or Safari) for this exam.");
      return false;
    }
    
    // Check for incognito/private mode
    if (window.navigator.webdriver) {
      alert("Automated browsers are not allowed for this exam.");
      return false;
    }
    
    setIsSafeBrowser(true);
    return true;
  };

  // Prevent screen capture
  const preventScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          logicalSurface: true,
          cursor: 'never'
        }
      });
      
      stream.getTracks().forEach(track => {
        track.stop();
        setScreenCaptureAttempts(prev => prev + 1);
        recordViolation("Screen capture attempt detected");
        
        if (screenCaptureAttempts >= 1) {
          alert("Screen capture detected. Your exam will be submitted automatically.");
          submitExam();
        }
      });
    } catch (err) {
      // This is expected - we're trying to prevent screen capture
      console.log("Screen capture prevention active");
    }
  };

  // Enhanced security check
  const performSecurityCheck = () => {
    // Don't perform security checks if exam hasn't started
    if (!isTimerRunning) {
      return;
    }

    const checks = {
      fullscreen: Boolean(document.fullscreenElement || 
                        document.mozFullScreenElement || 
                        document.webkitFullscreenElement || 
                        document.msFullscreenElement),
      singleTab: !document.hidden,
      safeBrowser: isSafeBrowser,
      noScreenCapture: screenCaptureAttempts === 0,
      noCopyPaste: true,
      noDevTools: !isDevToolsOpen(),
      noPrintScreen: !window.matchMedia('print').matches,
      noMultipleWindows: window.outerHeight === window.innerHeight && 
                        window.outerWidth === window.innerWidth
    };

    setSecurityChecks(checks);

    // If any security check fails, take immediate action
    if (!checks.fullscreen || !checks.singleTab || !checks.safeBrowser || 
        !checks.noScreenCapture || !checks.noDevTools || !checks.noMultipleWindows) {
      recordViolation("Security check failed");
      
      if (!checks.fullscreen) {
        enforceFullscreen();
        if (fullscreenAttempts >= 1) submitExam();
      }
      if (!checks.singleTab) {
        window.focus();
        if (document.hidden) submitExam();
      }
      if (!checks.noDevTools) submitExam();
      if (!checks.noMultipleWindows) submitExam();
    }
  };

  // Check for developer tools
  const isDevToolsOpen = () => {
    // Only check for dev tools in production
    if (process.env.NODE_ENV === 'development') {
      return false;
    }
    
    const threshold = 160;
    return (
      window.outerHeight - window.innerHeight > threshold ||
      window.outerWidth - window.innerWidth > threshold ||
      window.Firebug?.chrome?.isInitialized ||
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
      window.__REDUX_DEVTOOLS_EXTENSION__ ||
      window.__REACT_DEVELOPER_TOOLS__ ||
      window.__BACKBONE_DEVTOOLS__
    );
  };

  // Enhanced security monitoring
  const startSecurityMonitoring = () => {
    if (securityCheckInterval.current) {
      clearInterval(securityCheckInterval.current);
    }

    // Only start monitoring if exam is running
    if (!isTimerRunning) {
      return;
    }

    // Check every 500ms for better security
    securityCheckInterval.current = setInterval(() => {
      performSecurityCheck();

      // Check for multiple tabs
      if (document.hidden) {
        recordViolation("Multiple tabs detected");
        alert("Multiple tabs detected. Your exam will be submitted automatically.");
        submitExam();
      }

      // Check for screen capture
      preventScreenCapture();

      // Check for dev tools
      if (isDevToolsOpen()) {
        recordViolation("Developer tools detected");
        alert("Developer tools detected. Your exam will be submitted automatically.");
        submitExam();
      }

      // Check for print screen attempts
      if (window.matchMedia('print').matches) {
        recordViolation("Print screen attempt detected");
        alert("Print screen detected. Your exam will be submitted automatically.");
        submitExam();
      }

      // Check for multiple windows
      if (window.outerHeight !== window.innerHeight || 
          window.outerWidth !== window.innerWidth) {
        recordViolation("Multiple windows detected");
        alert("Multiple windows detected. Your exam will be submitted automatically.");
        submitExam();
      }
    }, 500);
  };

  // ENHANCED TAB SWITCHING DETECTION
  // This uses multiple methods to detect tab switching
  const startFocusDetection = () => {
    if (focusCheckInterval.current) {
      clearInterval(focusCheckInterval.current);
    }

    // Set initial focus time
    setLastFocusTime(Date.now());

    // Check focus every 200ms
    focusCheckInterval.current = setInterval(() => {
      const currentTime = Date.now();
      
      // If we're in a hidden state (tab not focused)
      if (document.hidden) {
        // Calculate time since last focus
        const timeSinceLastFocus = currentTime - lastFocusTime;
        
        // If we've been unfocused for more than 1 second
        if (timeSinceLastFocus > 1000) {
          handleTabSwitch();
        }
      } else {
        // Update last focus time when tab is active
        setLastFocusTime(currentTime);
      }
    }, 200);
  };

  const handleTabSwitch = () => {
    setTabSwitchAttempts(prev => {
      const newCount = prev + 1;
      
      if (newCount === 1) {
        // First violation - show warning
        setShowTabWarning(true);
        window.focus();
        enforceFullscreen();
        recordViolation("Tab switch detected - first warning");
      } else {
        // Multiple violations - submit exam
        recordViolation("Tab switch detected - multiple violations");
        alert("Multiple tab switching detected. Your exam will be submitted automatically.");
        submitExam();
      }
      
      return newCount;
    });
  };

  // Enhanced fullscreen enforcement
  const enforceFullscreen = async () => {
    if (!checkSafeBrowser()) {
      submitExam();
      return;
    }

    // Block the ESC key globally to prevent exiting fullscreen
    document.addEventListener('keydown', preventEscKey, true);
    document.addEventListener('keyup', preventEscKey, true);

    const docElement = document.documentElement;
    
    try {
      // Request fullscreen with all possible options
      if (docElement.requestFullscreen) {
        await docElement.requestFullscreen({
          navigationUI: 'hide',
          fullscreenNavigationUI: 'hide'
        });
      } else if (docElement.mozRequestFullScreen) {
        await docElement.mozRequestFullScreen({
          navigationUI: 'hide',
          fullscreenNavigationUI: 'hide'
        });
      } else if (docElement.webkitRequestFullscreen) {
        await docElement.webkitRequestFullscreen({
          navigationUI: 'hide',
          fullscreenNavigationUI: 'hide'
        });
      } else if (docElement.msRequestFullscreen) {
        await docElement.msRequestFullscreen({
          navigationUI: 'hide',
          fullscreenNavigationUI: 'hide'
        });
      }

      // Disable all possible exit methods
      document.addEventListener('keydown', preventFullscreenExit, true);
      document.addEventListener('keyup', preventFullscreenExit, true);
      document.addEventListener('keypress', preventFullscreenExit, true);
      document.addEventListener('mouseleave', preventFullscreenExit, true);
      document.addEventListener('mouseout', preventFullscreenExit, true);
      document.addEventListener('fullscreenchange', handleFullscreenChange, true);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange, true);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange, true);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange, true);
      
      // Start security monitoring
      startSecurityMonitoring();
      startFullscreenLock();
      startFocusDetection(); // Start tab focus detection
      
      setFullscreen(true);
      setIsFullscreen(true);
    } catch (err) {
      console.error("Fullscreen error:", err);
      recordViolation("Failed to enter fullscreen");
      alert("Fullscreen mode is required. Your exam will be submitted automatically.");
      submitExam();
    }
  };

  // Explicitly prevent ESC key
  const preventEscKey = (e) => {
    if (e.key === 'Escape' || e.keyCode === 27) {
      e.preventDefault();
      e.stopPropagation();
      recordViolation("ESC key pressed to exit fullscreen");
      return false;
    }
  };

  // Enhanced prevent fullscreen exit
  const preventFullscreenExit = (e) => {
    // Block all possible exit keys and combinations
    if (
      e.key === 'Escape' ||
      e.key === 'F11' ||
      (e.ctrlKey && e.key === 'f') ||
      (e.altKey && e.key === 'Enter') ||
      (e.altKey && e.key === 'F4') ||
      (e.ctrlKey && e.key === 'w') ||
      (e.ctrlKey && e.key === 'n') ||
      (e.ctrlKey && e.key === 't') ||
      (e.altKey && e.key === 'Tab') ||
      (e.metaKey && e.key === 'w') ||
      (e.metaKey && e.key === 'n') ||
      (e.metaKey && e.key === 't') ||
      (e.ctrlKey && e.key === 'r') ||
      (e.ctrlKey && e.key === 'u') ||
      (e.ctrlKey && e.key === 's') ||
      (e.ctrlKey && e.key === 'p') ||
      (e.ctrlKey && e.key === 'h') ||
      (e.ctrlKey && e.key === 'j') ||
      (e.ctrlKey && e.key === 'k') ||
      (e.ctrlKey && e.key === 'l') ||
      (e.ctrlKey && e.key === 'm') ||
      (e.ctrlKey && e.key === 'o') ||
      (e.ctrlKey && e.key === 'q') ||
      (e.ctrlKey && e.key === 'y') ||
      (e.ctrlKey && e.key === 'z') ||
      (e.altKey && e.key === 'ArrowLeft') ||
      (e.altKey && e.key === 'ArrowRight') ||
      (e.altKey && e.key === 'ArrowUp') ||
      (e.altKey && e.key === 'ArrowDown') ||
      (e.altKey && e.key === 'Home') ||
      (e.altKey && e.key === 'End') ||
      (e.altKey && e.key === 'PageUp') ||
      (e.altKey && e.key === 'PageDown') ||
      (e.altKey && e.key === 'Insert') ||
      (e.altKey && e.key === 'Delete') ||
      (e.altKey && e.key === 'Backspace') ||
      (e.altKey && e.key === 'Space') ||
      (e.altKey && e.key === 'Enter') ||
      (e.altKey && e.key === 'Escape') ||
      (e.altKey && e.key === 'Tab') ||
      (e.altKey && e.key === 'CapsLock') ||
      (e.altKey && e.key === 'Shift') ||
      (e.altKey && e.key === 'Control') ||
      (e.altKey && e.key === 'Alt') ||
      (e.altKey && e.key === 'Meta') ||
      (e.altKey && e.key === 'ContextMenu') ||
      (e.altKey && e.key === 'PrintScreen') ||
      (e.altKey && e.key === 'ScrollLock') ||
      (e.altKey && e.key === 'Pause') ||
      (e.altKey && e.key === 'Insert') ||
      (e.altKey && e.key === 'Home') ||
      (e.altKey && e.key === 'PageUp') ||
      (e.altKey && e.key === 'Delete') ||
      (e.altKey && e.key === 'End') ||
      (e.altKey && e.key === 'PageDown') ||
      (e.altKey && e.key === 'ArrowRight') ||
      (e.altKey && e.key === 'ArrowLeft') ||
      (e.altKey && e.key === 'ArrowDown') ||
      (e.altKey && e.key === 'ArrowUp') ||
      (e.altKey && e.key === 'NumLock') ||
      (e.altKey && e.key === 'NumpadDivide') ||
      (e.altKey && e.key === 'NumpadMultiply') ||
      (e.altKey && e.key === 'NumpadSubtract') ||
      (e.altKey && e.key === 'NumpadAdd') ||
      (e.altKey && e.key === 'NumpadEnter') ||
      (e.altKey && e.key === 'NumpadDecimal') ||
      (e.altKey && e.key === 'Numpad0') ||
      (e.altKey && e.key === 'Numpad1') ||
      (e.altKey && e.key === 'Numpad2') ||
      (e.altKey && e.key === 'Numpad3') ||
      (e.altKey && e.key === 'Numpad4') ||
      (e.altKey && e.key === 'Numpad5') ||
      (e.altKey && e.key === 'Numpad6') ||
      (e.altKey && e.key === 'Numpad7') ||
      (e.altKey && e.key === 'Numpad8') ||
      (e.altKey && e.key === 'Numpad9')
    ) {
      e.preventDefault();
      e.stopPropagation();
      recordViolation("Attempted to exit fullscreen");
      return false;
    }
  };

  // Handle fullscreen change
  const handleFullscreenChange = () => {
    const isFullscreenActive = document.fullscreenElement || 
                              document.mozFullScreenElement || 
                              document.webkitFullscreenElement || 
                              document.msFullscreenElement;
    
    if (!isFullscreenActive && isTimerRunning) {
      setFullscreenAttempts(prev => prev + 1);
      recordViolation("Exited fullscreen mode");
      
      // Immediate re-enforcement of fullscreen
      enforceFullscreen();
      
      if (fullscreenAttempts >= 1) {
        alert("Attempt to exit fullscreen detected. Your exam will be submitted automatically.");
        submitExam();
      }
    }
  };

  // Continuous fullscreen lock
  const startFullscreenLock = () => {
    if (fullscreenLockInterval.current) {
      clearInterval(fullscreenLockInterval.current);
    }

    fullscreenLockInterval.current = setInterval(() => {
      const isFullscreenActive = document.fullscreenElement || 
                                document.mozFullScreenElement || 
                                document.webkitFullscreenElement || 
                                document.msFullscreenElement;

      if (!isFullscreenActive && isTimerRunning) {
        setFullscreenAttempts(prev => prev + 1);
        recordViolation("Exited fullscreen mode");
        
        // Immediate re-enforcement of fullscreen
        enforceFullscreen();
        
        if (fullscreenAttempts >= 1) {
          alert("Attempt to exit fullscreen detected. Your exam will be submitted automatically.");
          submitExam();
        }
      }
    }, 100); // Check every 100ms for better security
  };

  // ENHANCED TAB SWITCHING DETECTION
  // Multiple methods to detect tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTimerRunning) {
        handleTabSwitch();
      }
    };

    const handleBeforeUnload = (e) => {
      if (isTimerRunning) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your exam progress will be lost and this may be recorded as a violation.';
        recordViolation("Attempted to leave page");
        return e.returnValue;
      }
    };

    const handleBlur = () => {
      if (isTimerRunning) {
        handleTabSwitch();
      }
    };

    const handleFocus = () => {
      // Update last focus time when focus is gained
      setLastFocusTime(Date.now());
    };

    // Prevent opening new tabs
    const handleKeyDown = (e) => {
      // Block tab switching key combinations
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === 't' || e.key === 'n' || e.key === 'w' || e.key === 'r' || 
           e.key === 'Tab' || e.key === '`' || e.key === '1' || e.key === '2' || 
           e.key === '3' || e.key === '4' || e.key === '5' || e.key === '6' || 
           e.key === '7' || e.key === '8' || e.key === '9')) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation("Attempted to use keyboard shortcut for tab switching");
        return false;
      }
      
      // Block Alt+Tab and other Alt combinations
      if (e.altKey || e.key === 'Alt') {
        e.preventDefault();
        e.stopPropagation();
        recordViolation("Attempted to use Alt key combinations");
        return false;
      }
    };
    
    // Register multiple event listeners for comprehensive detection
    document.addEventListener('visibilitychange', handleVisibilityChange, true);
    window.addEventListener('beforeunload', handleBeforeUnload, true);
    window.addEventListener('blur', handleBlur, true);
    window.addEventListener('focus', handleFocus, true);
    document.addEventListener('keydown', handleKeyDown, true);
    
    // Clean up all event listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange, true);
      window.removeEventListener('beforeunload', handleBeforeUnload, true);
      window.removeEventListener('blur', handleBlur, true);
      window.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      
      // Also clean up intervals
      if (focusCheckInterval.current) clearInterval(focusCheckInterval.current);
    };
  }, [isTimerRunning, tabSwitchAttempts]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (faceDetectionInterval.current) clearInterval(faceDetectionInterval.current);
      if (fullscreenCheckInterval.current) clearInterval(fullscreenCheckInterval.current);
      if (fullscreenLockInterval.current) clearInterval(fullscreenLockInterval.current);
      if (securityCheckInterval.current) clearInterval(securityCheckInterval.current);
      if (devToolsCheckInterval.current) clearInterval(devToolsCheckInterval.current);
      if (focusCheckInterval.current) clearInterval(focusCheckInterval.current);
      
      // Stop camera if active
      stopCamera();
    };
  }, []);

  // Tab warning component
  const TabWarning = () => (
    <div className={styles.tabWarning}>
      <h3>Warning: Tab Switching Detected</h3>
      <p>You have attempted to switch tabs or open a new tab.</p>
      <p>Attempts: {tabSwitchAttempts}. Any further attempts will result in automatic exam submission.</p>
      <button onClick={() => setShowTabWarning(false)}>I Understand</button>
    </div>
  );

  // Enhanced face detection using face-api.js
  const startBasicFaceDetection = async () => {
    if (!isModelLoaded) {
      console.error("Face detection models not loaded");
      return;
    }

    try {
      console.log("Starting face detection...");
      faceDetectionInterval.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.srcObject) {
          try {
            // Create a canvas for face detection
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);

            // Detect faces with improved options
            const detections = await faceapi.detectAllFaces(
              canvas,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,
                scoreThreshold: 0.5
              })
            );

            const numFaces = detections.length;
            console.log(`Detected ${numFaces} faces`);
            setFaceCount(numFaces);
            
            if (numFaces === 0) {
              setFaceDetected(false);
              recordViolation("No face detected");
            } else if (numFaces === 1) {
              setFaceDetected(true);
            } else {
              setFaceDetected(false);
              recordViolation("Multiple faces detected");
              alert("Multiple faces detected! This is not allowed. Your exam will be submitted automatically.");
              submitExam();
            }
          } catch (error) {
            console.error("Face detection error:", error);
            setFaceDetectionError("Face detection failed. Please check your camera.");
            recordViolation("Face detection error");
          }
        }
      }, 1000); // Check every second
    } catch (error) {
      console.error("Error starting face detection:", error);
      setFaceDetectionError("Failed to start face detection. Please refresh the page.");
      recordViolation("Face detection initialization failed");
    }
  };

  // Stop camera and face detection
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
    
    if (faceDetectionInterval.current) {
      clearInterval(faceDetectionInterval.current);
    }
  };

  // Timer functionality
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prevTimer => {
          const { hours, minutes, seconds } = prevTimer;
          
          if (hours === 0 && minutes === 0 && seconds === 0) {
            clearInterval(interval);
            submitExam();
            return prevTimer;
          }
          
          let newSeconds = seconds - 1;
          let newMinutes = minutes;
          let newHours = hours;
          
          if (newSeconds < 0) {
            newSeconds = 59;
            newMinutes -= 1;
          }
          
          if (newMinutes < 0) {
            newMinutes = 59;
            newHours -= 1;
          }
          
          return { hours: newHours, minutes: newMinutes, seconds: newSeconds };
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Prevent copy-paste functionality
  const preventCopyPaste = (e) => {
    // Prevent copy
    if (e.type === 'copy' || 
        (e.ctrlKey && e.key === 'c') || 
        (e.metaKey && e.key === 'c')) {
      e.preventDefault();
      recordViolation("Attempted to copy content");
      return false;
    }
    
    // Prevent paste
    if (e.type === 'paste' || 
        (e.ctrlKey && e.key === 'v') || 
        (e.metaKey && e.key === 'v')) {
      e.preventDefault();
      recordViolation("Attempted to paste content");
      return false;
    }
    
    // Prevent cut
    if (e.type === 'cut' || 
        (e.ctrlKey && e.key === 'x') || 
        (e.metaKey && e.key === 'x')) {
      e.preventDefault();
      recordViolation("Attempted to cut content");
      return false;
    }
  };

  // Add copy-paste prevention to all input elements
  useEffect(() => {
    const preventInputPaste = (e) => {
      e.preventDefault();
      recordViolation("Attempted to paste in input field");
      return false;
    };

    // Add event listeners to all input and textarea elements
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('paste', preventInputPaste, true);
      input.addEventListener('copy', preventCopyPaste, true);
      input.addEventListener('cut', preventCopyPaste, true);
    });

    // Add global event listeners
    document.addEventListener('copy', preventCopyPaste, true);
    document.addEventListener('paste', preventCopyPaste, true);
    document.addEventListener('cut', preventCopyPaste, true);
    document.addEventListener('keydown', preventCopyPaste, true);

    // Cleanup
    return () => {
      inputs.forEach(input => {
        input.removeEventListener('paste', preventInputPaste, true);
        input.removeEventListener('copy', preventCopyPaste, true);
        input.removeEventListener('cut', preventCopyPaste, true);
      });
      document.removeEventListener('copy', preventCopyPaste, true);
      document.removeEventListener('paste', preventCopyPaste, true);
      document.removeEventListener('cut', preventCopyPaste, true);
      document.removeEventListener('keydown', preventCopyPaste, true);
    };
  }, []);

  // Prevent right-click context menu
  useEffect(() => {
    const preventContextMenu = (e) => {
      e.preventDefault();
      recordViolation("Attempted to use context menu");
      return false;
    };

    document.addEventListener('contextmenu', preventContextMenu, true);
    return () => document.removeEventListener('contextmenu', preventContextMenu, true);
  }, []);

  const handleSectionChange = (section) => {
    setCurrentSection(section);
    setCurrentQuestion(examData.sections[section].questions[0]);
  };

  const handleQuestionChange = (question) => {
    setCurrentQuestion(question);
  };

  const handleAnswerChange = (e) => {
    const value = e.target.value;
    // Remove any pasted content
    if (e.nativeEvent.inputType === 'insertFromPaste') {
      e.preventDefault();
      recordViolation("Attempted to paste in answer field");
      return;
    }
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleMultipleChoiceAnswer = (option) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }));
  };

  const handleSaveAnswer = () => {
    console.log(`Answer saved for question ${currentQuestion.id}`);
    alert(`Answer for question ${currentQuestion.id} saved successfully!`);
  };

  const submitExam = () => {
    // In a real implementation, this would submit all answers to the backend
    alert("Exam submitted successfully!");
    console.log("Submitting exam answers:", answers);
    setIsTimerRunning(false);
    stopCamera();
    
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    
    // Navigate to a thank you page or some completion page
    // navigate('/exam-complete');
  };

  // Handle ready button click
  const handleReady = async () => {
    try {
      await enforceFullscreen();
      setIsReady(true);
      setShowInstructions(false);
      setCurrentSection('A');
      setCurrentQuestion(examData.sections['A'].questions[0]);
      setIsTimerRunning(true);
      initializeCamera();
      startSecurityMonitoring(); // Start security monitoring after exam starts
    } catch (error) {
      console.error("Error starting exam:", error);
      alert("There was an error starting the exam. Please try again.");
    }
  };

  // Update the camera container to show loading and error states
  const renderCameraContainer = () => (
    <div className={styles.cameraContainer}>
      <h4>Proctoring Camera</h4>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className={styles.cameraFeed}
      />
      <div className={styles.faceDetectionStatus}>
        {!isModelLoaded ? (
          <span className={styles.loading}>Loading face detection...</span>
        ) : faceDetectionError ? (
          <span className={styles.error}>{faceDetectionError}</span>
        ) : (
          <>
            Face Detection: {faceDetected ? (
              <span className={styles.detected}>Active</span>
            ) : (
              <span className={styles.notDetected}>Not Detected</span>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Render instructions page
  if (showInstructions) {
    return (
      <div className={styles.examContainer}>
        <div className={styles.instructionsContainer}>
          <div className={styles.universityLogo}>
            <h2>Clarke International University</h2>
          </div>
          <h1>{examData.instructions.title}</h1>
          <div className={styles.instructions}>
            {examData.instructions.content.map((instruction, index) => (
              <p key={index}>{instruction}</p>
            ))}
          </div>
          <div className={styles.startButtonContainer}>
            <button className={styles.startButton} onClick={handleReady}>
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine if we need to show the next/prev question buttons
  const currentSectionQuestions = examData.sections[currentSection].questions;
  const currentQuestionIndex = currentSectionQuestions.findIndex(q => q.id === currentQuestion?.id);
  const hasPrevQuestion = currentQuestionIndex > 0;
  const hasNextQuestion = currentQuestionIndex < currentSectionQuestions.length - 1;

  return (
    <div className={styles.examContainer}>
      {showTabWarning && <TabWarning />}
      {!isReady ? (
        <div className={styles.readyScreen}>
          <h2>Exam Instructions</h2>
          <div className={styles.instructions}>
            <p>Before starting the exam, please ensure:</p>
            <ul>
              <li>You are in a quiet, well-lit environment</li>
              <li>Your camera is working properly</li>
              <li>You have a stable internet connection</li>
              <li>You have closed all other applications and tabs</li>
              <li>You have read and understood the exam rules</li>
            </ul>
            <p>Click the "I'm Ready" button to start the exam in full-screen mode.</p>
            <button 
              className={styles.readyButton}
              onClick={handleReady}
            >
              I'm Ready
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.examHeader}>
            <div className={styles.universityLogo}>
              <h3>Clarke International University</h3>
            </div>
            <div className={styles.examTimer}>
              Time Remaining: {String(timer.hours).padStart(2, '0')}:
              {String(timer.minutes).padStart(2, '0')}:
              {String(timer.seconds).padStart(2, '0')}
            </div>
          </div>
          
          <div className={styles.examContent}>
            <div className={styles.sidebar}>
              {Object.keys(examData.sections).map(sectionKey => (
                <div key={sectionKey} className={styles.sectionNav}>
                  <div 
                    className={`${styles.sectionHeader} ${currentSection === sectionKey ? styles.activeSectionHeader : ''}`}
                    onClick={() => handleSectionChange(sectionKey)}
                  >
                    {examData.sections[sectionKey].title}
                  </div>
                  
                  {currentSection === sectionKey && (
                    <div className={styles.questionList}>
                      {examData.sections[sectionKey].questions.map(question => (
                        <div 
                          key={question.id}
                          className={`${styles.questionItem} ${currentQuestion?.id === question.id ? styles.activeQuestion : ''}`}
                          onClick={() => handleQuestionChange(question)}
                        >
                          {question.id}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <div className={styles.proctoringStatus}>
                <h4>Proctoring Status</h4>
                <div className={styles.statusItem}>
                  <span>Security Status:</span>
                  <span className={Object.values(securityChecks).every(check => check) ? styles.statusActive : styles.statusWarning}>
                    {Object.values(securityChecks).every(check => check) ? 'All Secure' : 'Security Compromised'}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span>Browser:</span>
                  <span className={isSafeBrowser ? styles.statusActive : styles.statusInactive}>
                    {isSafeBrowser ? 'Secure' : 'Unsupported'}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span>Camera:</span>
                  <span className={cameraActive ? styles.statusActive : styles.statusInactive}>
                    {cameraActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span>Face Detection:</span>
                  <span className={faceDetected ? styles.statusActive : styles.statusInactive}>
                    {faceDetected ? 'Single Face Detected' : 'No Face/Multiple Faces'}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span>Fullscreen:</span>
                  <span className={isFullscreen ? styles.statusActive : styles.statusInactive}>
                    {isFullscreen ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span>Screen Capture:</span>
                  <span className={screenCaptureAttempts === 0 ? styles.statusActive : styles.statusWarning}>
                    {screenCaptureAttempts === 0 ? 'Blocked' : 'Attempted'}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span>Single Tab:</span>
                  <span className={!document.hidden ? styles.statusActive : styles.statusWarning}>
                    {!document.hidden ? 'Active' : 'Multiple Tabs'}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span>Dev Tools:</span>
                  <span className={!isDevToolsOpen() ? styles.statusActive : styles.statusWarning}>
                    {!isDevToolsOpen() ? 'Blocked' : 'Detected'}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span>Multiple Windows:</span>
                  <span className={window.outerHeight === window.innerHeight && window.outerWidth === window.innerWidth ? styles.statusActive : styles.statusWarning}>
                    {window.outerHeight === window.innerHeight && window.outerWidth === window.innerWidth ? 'Blocked' : 'Detected'}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span>Violations:</span>
                  <span className={violationCount > 0 ? styles.statusWarning : styles.statusGood}>
                    {violationCount}
                  </span>
                </div>
              </div>
              
              <button className={styles.submitButton} onClick={submitExam}>
                Submit Exam
              </button>
            </div>
            
            <div className={styles.questionContainer}>
              {currentQuestion && (
                <>
                  <div className={styles.questionHeader}>
                    <h3>{examData.sections[currentSection].title}: Question {currentQuestion.id}</h3>
                    <p className={styles.questionType}>{examData.sections[currentSection].description}</p>
                  </div>
                  
                  <div className={styles.questionContent}>
                    <p className={styles.questionText}>{currentQuestion.text}</p>
                    
                    {currentQuestion.type === 'multiple-choice' && (
                      <div className={styles.multipleChoiceContainer}>
                        {currentQuestion.options.map((option, index) => (
                          <div 
                            key={index} 
                            className={`${styles.optionItem} ${answers[currentQuestion.id] === option ? styles.selectedOption : ''}`}
                            onClick={() => handleMultipleChoiceAnswer(option)}
                          >
                            <span className={styles.optionLetter}>{String.fromCharCode(65 + index)}</span>
                            <span className={styles.optionText}>{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'essay') && (
                      <textarea
                        className={`${styles.answerTextarea} ${currentQuestion.type === 'essay' ? styles.essayTextarea : ''}`}
                        value={answers[currentQuestion.id] || ''}
                        onChange={handleAnswerChange}
                        placeholder={`Type your ${currentQuestion.type === 'essay' ? 'essay' : 'answer'} here...`}
                      />
                    )}
                  </div>
                  
                  <div className={styles.questionNavigation}>
                    {hasPrevQuestion && (
                      <button 
                        className={styles.navButton}
                        onClick={() => handleQuestionChange(currentSectionQuestions[currentQuestionIndex - 1])}
                      >
                        Previous Question
                      </button>
                    )}
                    
                    <button 
                      className={styles.saveButton}
                      onClick={handleSaveAnswer}
                    >
                      Save Answer
                    </button>
                    
                    {hasNextQuestion && (
                      <button 
                        className={styles.navButton}
                        onClick={() => handleQuestionChange(currentSectionQuestions[currentQuestionIndex + 1])}
                      >
                        Next Question
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {renderCameraContainer()}
          </div>
        </>
      )}
    </div>
  );
};

export default ExamInterface;