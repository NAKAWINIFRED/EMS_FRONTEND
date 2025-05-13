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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenAttempts, setFullscreenAttempts] = useState(0);
  const [isSafeBrowser, setIsSafeBrowser] = useState(false);
  const [screenCaptureAttempts, setScreenCaptureAttempts] = useState(0);
  const [securityChecks, setSecurityChecks] = useState({
    fullscreen: false,
    safeBrowser: false,
    noScreenCapture: false,
    noCopyPaste: true,
    noDevTools: false,
    noPrintScreen: false,
    noMultipleWindows: false
  });
  const [isReady, setIsReady] = useState(false);
  const [violations, setViolations] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDetectionError, setFaceDetectionError] = useState(null);
  const [faceCount, setFaceCount] = useState(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
 
  const videoRef = useRef(null);
  const faceDetectionInterval = useRef(null);
  const fullscreenCheckInterval = useRef(null);
  const fullscreenLockInterval = useRef(null);
  const securityCheckInterval = useRef(null);
  const devToolsCheckInterval = useRef(null);
  const navigate = useNavigate();


  // Record violations for audit trail
  const recordViolation = (type) => {
    const violation = {
      type,
      timestamp: new Date().toISOString(),
    };
    console.log("Violation recorded:", violation);
    setViolations(prev => [...prev, violation]);
  };


  // Load face detection model
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setIsModelLoaded(true);
        setFaceDetectionError(null);
      } catch (error) {
        setFaceDetectionError("Face detection model not found. Please contact support.");
      }
    };
    loadModels();
  }, []);


  // Initialize camera and start face detection
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
        await videoRef.current.play();
        setCameraActive(true);
        setCameraError(null);
        console.log("Camera initialized successfully");
        if (isModelLoaded) {
          startFaceDetection();
        }
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Camera access denied. Please enable camera permissions.");
      recordViolation("Camera access denied");
      alert("Camera access is required for this exam. Please enable camera permissions and refresh the page.");
    }
  };


  // Start face detection
  const startFaceDetection = () => {
    if (faceDetectionInterval.current) clearInterval(faceDetectionInterval.current);
    faceDetectionInterval.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          const detections = await faceapi.detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          );
          setFaceCount(detections.length);
          if (detections.length === 1) {
            setFaceDetected(true);
            setFaceDetectionError(null);
          } else {
            setFaceDetected(false);
            if (detections.length === 0) {
              setFaceDetectionError("No face detected! Please stay in front of the camera.");
              recordViolation("No face detected");
            } else if (detections.length > 1) {
              setFaceDetectionError("Multiple faces detected! Only one person is allowed.");
              recordViolation("Multiple faces detected");
            }
          }
        } catch (err) {
          setFaceDetectionError("Face detection error.");
        }
      }
    }, 1000);
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
    if (!isTimerRunning) return;


    const checks = {
      fullscreen: Boolean(document.fullscreenElement ||
                        document.mozFullScreenElement ||
                        document.webkitFullscreenElement ||
                        document.msFullscreenElement),
      safeBrowser: isSafeBrowser,
      noScreenCapture: screenCaptureAttempts === 0,
      noCopyPaste: true,
      noDevTools: !isDevToolsOpen(),
      noPrintScreen: !window.matchMedia('print').matches,
      noMultipleWindows: window.outerHeight === window.innerHeight &&
                        window.outerWidth === window.innerWidth
    };


    setSecurityChecks(checks);


    if (!checks.fullscreen || !checks.safeBrowser ||
        !checks.noScreenCapture || !checks.noDevTools || !checks.noMultipleWindows) {
      recordViolation("Security check failed");
      submitExam();
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


    if (!isTimerRunning) {
      return;
    }


    securityCheckInterval.current = setInterval(() => {
      performSecurityCheck();


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


  // Enhanced fullscreen enforcement
  const enforceFullscreen = async () => {
    if (!checkSafeBrowser()) {
      submitExam();
      return;
    }


    const docElement = document.documentElement;
   
    try {
      if (docElement.requestFullscreen) {
        await docElement.requestFullscreen();
      } else if (docElement.mozRequestFullScreen) {
        await docElement.mozRequestFullScreen();
      } else if (docElement.webkitRequestFullscreen) {
        await docElement.webkitRequestFullscreen();
      } else if (docElement.msRequestFullscreen) {
        await docElement.msRequestFullscreen();
      }


      // Start monitoring but don't prevent ESC
      startSecurityMonitoring();
    } catch (err) {
      console.error("Fullscreen error:", err);
      submitExam();
    }
  };


  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (faceDetectionInterval.current) clearInterval(faceDetectionInterval.current);
      if (fullscreenCheckInterval.current) clearInterval(fullscreenCheckInterval.current);
      if (fullscreenLockInterval.current) clearInterval(fullscreenLockInterval.current);
      if (securityCheckInterval.current) clearInterval(securityCheckInterval.current);
      if (devToolsCheckInterval.current) clearInterval(devToolsCheckInterval.current);
      stopCamera();
    };
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
    // Save the current answer
    localStorage.setItem('examAnswers', JSON.stringify(answers));
    console.log(`Answer saved for question ${currentQuestion.id}`);
   
    // Ensure we're still in fullscreen mode
    const isFullscreenActive = document.fullscreenElement ||
                              document.mozFullScreenElement ||
                              document.webkitFullscreenElement ||
                              document.msFullscreenElement;
   
    if (!isFullscreenActive) {
      const docElement = document.documentElement;
      if (docElement.requestFullscreen) {
        docElement.requestFullscreen();
      } else if (docElement.mozRequestFullScreen) {
        docElement.mozRequestFullScreen();
      } else if (docElement.webkitRequestFullscreen) {
        docElement.webkitRequestFullscreen();
      } else if (docElement.msRequestFullscreen) {
        docElement.msRequestFullscreen();
      }
    }
  };


  const submitExam = () => {
    // Save final answers
    localStorage.setItem('examAnswers', JSON.stringify(answers));
    console.log("Submitting exam answers:", answers);
   
    // Stop all monitoring
    setIsTimerRunning(false);
    stopCamera();
   
    // Clear all intervals
    if (faceDetectionInterval.current) clearInterval(faceDetectionInterval.current);
    if (fullscreenCheckInterval.current) clearInterval(fullscreenCheckInterval.current);
    if (fullscreenLockInterval.current) clearInterval(fullscreenLockInterval.current);
    if (securityCheckInterval.current) clearInterval(securityCheckInterval.current);
    if (devToolsCheckInterval.current) clearInterval(devToolsCheckInterval.current);
   
    // Navigate to completion page immediately without any warning
    navigate('/exam-complete');
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
      <div className={styles.cameraStatus}>
        {!isModelLoaded ? (
          <span className={styles.loading}>Loading face detection...</span>
        ) : faceDetectionError ? (
          <span className={styles.error}>{faceDetectionError}</span>
        ) : (
          <>
            Face Detection: {faceDetected ? (
              <span className={styles.detected}>One Face Detected</span>
            ) : (
              <span className={styles.notDetected}>Not Detected / Multiple Faces</span>
            )}
          </>
        )}
      </div>
    </div>
  );


  // Modify the handleReady function
  const handleReady = async () => {
    try {
      // Enter fullscreen immediately when starting exam
      const docElement = document.documentElement;
      if (docElement.requestFullscreen) {
        await docElement.requestFullscreen();
      } else if (docElement.mozRequestFullScreen) {
        await docElement.mozRequestFullScreen();
      } else if (docElement.webkitRequestFullscreen) {
        await docElement.webkitRequestFullscreen();
      } else if (docElement.msRequestFullscreen) {
        await docElement.msRequestFullscreen();
      }


      setIsReady(true);
      setShowInstructions(false);
      setCurrentSection('A');
      setCurrentQuestion(examData.sections['A'].questions[0]);
      setIsTimerRunning(true);
      initializeCamera();
      startSecurityMonitoring();
    } catch (error) {
      console.error("Error starting exam:", error);
      alert("There was an error starting the exam. Please try again.");
    }
  };


  // Modify the handleFullscreenChange function
  const handleFullscreenChange = () => {
    const isFullscreenActive = document.fullscreenElement ||
                              document.mozFullScreenElement ||
                              document.webkitFullscreenElement ||
                              document.msFullscreenElement;
   
    if (!isFullscreenActive && isTimerRunning) {
      // Save current answers and submit immediately
      localStorage.setItem('examAnswers', JSON.stringify(answers));
      submitExam();
    }
  };


  // Add useEffect for fullscreen change detection
  useEffect(() => {
    // Add event listener for fullscreen change
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);


    // Add ESC key detection
    const handleEscKey = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (isTimerRunning) {
          // Save current answers and submit immediately
          localStorage.setItem('examAnswers', JSON.stringify(answers));
          submitExam();
        }
      }
    };


    window.addEventListener('keydown', handleEscKey);


    return () => {
      // Clean up listeners
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isTimerRunning, answers]);


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
      {!isReady ? (
        <div className={styles.readyScreen}>
          <h2>Exam Instructions</h2>
          <div className={styles.instructions}>
            <p>Before starting the exam, please ensure:</p>
            <ul>
              <li>You are in a quiet, well-lit environment</li>
              <li>Your camera is working properly</li>
              <li>You have a stable internet connection</li>
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
                  <span>Screen Capture:</span>
                  <span className={screenCaptureAttempts === 0 ? styles.statusActive : styles.statusWarning}>
                    {screenCaptureAttempts === 0 ? 'Blocked' : 'Attempted'}
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
                  <span className={violations.length > 0 ? styles.statusWarning : styles.statusGood}>
                    {violations.length}
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
