import { useState, useCallback, useEffect, useMemo, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Settings,
  Shuffle,
  FlipVertical,
  FlipHorizontal,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Clock,
  Bookmark,
  BookmarkCheck,
  Play,
  Pause,
  RotateCcw as Restart,
  Expand,
  Shrink,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Virtual } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/virtual";
import { trackEvent } from "@/lib/analytics";

// Interfaces
interface FlashcardData {
  type: "front" | "back";
  slideNumber: number;
  imageName: string;
}

interface Flashcard {
  id: string;
  frontImageUrl: string;
  backImageUrl: string;
  cardNumber: number;
}

interface FlashcardViewerProps {
  flashcardData: FlashcardData[];
  title: string;
  onBack: () => void;
}

interface ViewerSettings {
  isVertical: boolean;
  isRandomized: boolean;
  autoPlay: boolean;
  autoPlaySpeed: number;
}

// Optimized Image Component with fast loading
const OptimizedImage = memo(
  ({
    src,
    alt,
    className,
    style,
    onLoad,
    onError,
  }: {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    onLoad?: () => void;
    onError?: () => void;
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
      onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
      setHasError(true);
      onError?.();
    }, [onError]);

    return (
      <div className="relative w-full h-full">
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}
        {hasError && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="h-8 w-8 mx-auto mb-2 bg-gray-300 rounded"></div>
              <p className="text-sm">Failed to load image</p>
            </div>
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className={`${className} ${
            isLoaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-200`}
          style={{
            ...style,
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
          }}
          onLoad={handleLoad}
          onError={handleError}
          draggable={false}
          loading="eager"
        />
      </div>
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";

// Memoized Card Component for better performance
const FlashcardSlide = memo(
  ({
    card,
    index,
    isFlipped,
    isBookmarked,
    zoomLevel,
    cardKey,
    isFullscreen,
    onFlip,
    onBookmarkToggle,
    onZoomChange,
  }: {
    card: Flashcard;
    index: number;
    isFlipped: boolean;
    isBookmarked: boolean;
    zoomLevel: number;
    cardKey: number;
    isFullscreen: boolean;
    onFlip: () => void;
    onBookmarkToggle: (e: React.MouseEvent) => void;
    onZoomChange: (
      action: "increase" | "decrease" | "reset",
      e: React.MouseEvent
    ) => void;
  }) => {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="relative"
        style={{
          perspective: "1000px",
        }}
      >
        <motion.div
          key={`${card.id}-${index}-${cardKey}`}
          className="relative w-full h-full card-container"
          style={{
            width: isFullscreen
              ? "clamp(320px, 50vw, 400px)"
              : "clamp(240px, 85vw, 280px)",
            height: isFullscreen
              ? "clamp(640px, 80vh, 800px)"
              : "clamp(480px, 75vh, 600px)",
            transformStyle: "preserve-3d",
          }}
          initial={{ rotateY: 0 }}
          animate={{
            rotateY: isFlipped ? 180 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.6,
          }}
          onClick={onFlip}
        >
          {/* Front of Card */}
          <motion.div
            className="absolute w-full h-full rounded-3xl overflow-hidden shadow-2xl border-0 bg-white card-face"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(0deg)",
              zIndex: !isFlipped ? 2 : 1,
            }}
          >
            <div className="absolute top-2 left-2 z-20">
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-full bg-background/80 hover:bg-background shadow-md"
                  onClick={onBookmarkToggle}
                >
                  <AnimatePresence mode="wait">
                    {isBookmarked ? (
                      <motion.div
                        key="bookmarked"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <BookmarkCheck className="h-6 w-6 text-blue-500 fill-blue-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="not-bookmarked"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Bookmark className="h-6 w-6 text-blue-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>

            <div
              className="relative w-full h-full"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
                transition: "transform 0.2s ease-out",
              }}
            >
              <OptimizedImage
                src={card.frontImageUrl}
                alt={`Card ${card.cardNumber} front`}
                className="w-full h-full object-cover"
              />
            </div>

            {zoomLevel !== 1 && (
              <motion.div
                className="absolute bottom-4 right-4 z-20 flex gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-full bg-background/80 hover:bg-background shadow-md"
                  onClick={(e) => onZoomChange("decrease", e)}
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-full bg-background/80 hover:bg-background shadow-md"
                  onClick={(e) => onZoomChange("reset", e)}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-full bg-background/80 hover:bg-background shadow-md"
                  onClick={(e) => onZoomChange("increase", e)}
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Back of Card */}
          <motion.div
            className="absolute w-full h-full rounded-3xl overflow-hidden shadow-2xl border-0 bg-white card-face"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(-180deg)",
              zIndex: isFlipped ? 2 : 1,
            }}
          >
            <div className="absolute top-2 left-2 z-20">
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-full bg-background/80 hover:bg-background shadow-md"
                  onClick={onBookmarkToggle}
                >
                  <AnimatePresence mode="wait">
                    {isBookmarked ? (
                      <motion.div
                        key="bookmarked"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <BookmarkCheck className="h-6 w-6 text-blue-500 fill-blue-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="not-bookmarked"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Bookmark className="h-6 w-6 text-blue-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>

            <div
              className="relative w-full h-full"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
                transition: "transform 0.2s ease-out",
              }}
            >
              <OptimizedImage
                src={card.backImageUrl}
                alt={`Card ${card.cardNumber} back`}
                className="w-full h-full object-cover"
              />
            </div>

            {zoomLevel !== 1 && (
              <motion.div
                className="absolute bottom-4 right-4 z-20 flex gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-full bg-background/80 hover:bg-background shadow-md"
                  onClick={(e) => onZoomChange("decrease", e)}
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-full bg-background/80 hover:bg-background shadow-md"
                  onClick={(e) => onZoomChange("reset", e)}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-full bg-background/80 hover:bg-background shadow-md"
                  onClick={(e) => onZoomChange("increase", e)}
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }
);

FlashcardSlide.displayName = "FlashcardSlide";

export default function FlashcardViewer({
  flashcardData,
  title,
  onBack,
}: FlashcardViewerProps) {
  const structuredFlashcards = useMemo(() => {
    const flashcards: Flashcard[] = [];
    for (let i = 0; i < flashcardData.length; i++) {
      if (flashcardData[i].type === "front") {
        const front = flashcardData[i];
        const back = flashcardData.find(
          (card) =>
            card.type === "back" && card.slideNumber === front.slideNumber + 1
        );
        if (back) {
          flashcards.push({
            id: front.imageName,
            frontImageUrl: `https://tools.easylearning.live/uploads/${front.imageName}`,
            backImageUrl: `https://tools.easylearning.live/uploads/${back.imageName}`,
            cardNumber: flashcards.length + 1,
          });
        }
      }
    }
    return flashcards;
  }, [flashcardData]);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settings, setSettings] = useState<ViewerSettings>({
    isVertical: true,
    isRandomized: false,
    autoPlay: false,
    autoPlaySpeed: 5,
  });
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);
  const [bookmarkedCards, setBookmarkedCards] = useState<Set<string>>(
    new Set()
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [studyTime, setStudyTime] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [originalTheme, setOriginalTheme] = useState<string | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
          /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      );
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Dark mode functionality for fullscreen
  useEffect(() => {
    if (isFullscreen) {
      // Store original theme and switch to dark
      const currentTheme = document.documentElement.getAttribute("data-theme");
      setOriginalTheme(currentTheme);
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      // Restore original theme
      if (originalTheme !== null) {
        if (originalTheme) {
          document.documentElement.setAttribute("data-theme", originalTheme);
        } else {
          document.documentElement.removeAttribute("data-theme");
        }
        if (originalTheme !== "dark") {
          document.documentElement.classList.remove("dark");
        }
        setOriginalTheme(null);
      }
    }
  }, [isFullscreen, originalTheme]);

  // Fullscreen functionality
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!isFullscreen) {
        const element = containerRef.current;
        if (!element) return;

        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
      triggerHaptic();
    } catch (error) {
      console.warn("Fullscreen operation failed:", error);
    }
  }, [isFullscreen]);

  useEffect(() => {
    setShuffledCards([...structuredFlashcards]);
  }, [structuredFlashcards]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => {
        setStudyTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  // Auto-play effect
  useEffect(() => {
    if (settings.autoPlay) {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
      autoPlayTimerRef.current = setTimeout(() => {
        if (swiperRef.current) {
          if (swiperRef.current.isEnd) {
            swiperRef.current.slideTo(0);
          } else {
            swiperRef.current.slideNext();
          }
        }
      }, settings.autoPlaySpeed * 1000);
    }
    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, [settings.autoPlay, settings.autoPlaySpeed, currentCardIndex, isFlipped]);

  useEffect(() => {
    if (showSummary) {
      setTimerActive(false);
    }
  }, [showSummary]);

  const currentCards = useMemo(() => {
    return settings.isRandomized ? shuffledCards : structuredFlashcards;
  }, [settings.isRandomized, shuffledCards, structuredFlashcards]);

  // Enhanced image preloading with aggressive caching
  useEffect(() => {
    const preloadImages = async () => {
      const preloadCount = isMobile ? 5 : 8; // Increased preload count
      const startIndex = Math.max(0, currentCardIndex - 2);
      const endIndex = Math.min(startIndex + preloadCount, currentCards.length);

      const preloadPromises = [];

      for (let i = startIndex; i < endIndex; i++) {
        const card = currentCards[i];
        if (card) {
          // Preload front image
          if (!imageCache.current.has(`${card.id}-front`)) {
            const frontImg = new Image();
            frontImg.crossOrigin = "anonymous";
            imageCache.current.set(`${card.id}-front`, frontImg);
            preloadPromises.push(
              new Promise<void>((resolve) => {
                frontImg.onload = () => resolve();
                frontImg.onerror = () => resolve();
                frontImg.src = card.frontImageUrl;
              })
            );
          }

          // Preload back image
          if (!imageCache.current.has(`${card.id}-back`)) {
            const backImg = new Image();
            backImg.crossOrigin = "anonymous";
            imageCache.current.set(`${card.id}-back`, backImg);
            preloadPromises.push(
              new Promise<void>((resolve) => {
                backImg.onload = () => resolve();
                backImg.onerror = () => resolve();
                backImg.src = card.backImageUrl;
              })
            );
          }
        }
      }

      // Load images in parallel with no artificial delay
      await Promise.all(preloadPromises);
    };

    preloadImages();
  }, [currentCardIndex, currentCards, isMobile]);

  const progress = useMemo(
    () => ((currentCardIndex + 1) / currentCards.length) * 100,
    [currentCardIndex, currentCards.length]
  );

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const triggerHaptic = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleFlip = useCallback(() => {
    triggerHaptic();
    setIsFlipped((prev) => !prev);
  }, [triggerHaptic]);

  const handleSlideChange = useCallback(
    (swiper: SwiperType) => {
      const newIndex = swiper.activeIndex;
      if (newIndex !== currentCardIndex) {
        setCurrentCardIndex(newIndex);
        setIsFlipped(false);
        setCardKey((prev) => prev + 1);
        triggerHaptic();
        if (newIndex === currentCards.length - 1) {
          setTimeout(() => {
            setShowSummary(true);
          }, 1000);
        }
      }
    },
    [currentCardIndex, triggerHaptic, currentCards.length]
  );

  const randomizeCards = useCallback(() => {
    const shuffled = [...currentCards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setCardKey((prev) => prev + 1);
    setShowSummary(false);
    swiperRef.current?.slideTo(0, 0);
    triggerHaptic();
  }, [currentCards, triggerHaptic]);

  const handleSettingsChange = useCallback(
    (key: keyof ViewerSettings, value: any) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      if (key === "isRandomized" && value) {
        randomizeCards();
      } else if (key === "isRandomized" && !value) {
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setCardKey((prev) => prev + 1);
        setShowSummary(false);
        swiperRef.current?.slideTo(0, 0);
      }
      triggerHaptic();
    },
    [randomizeCards, triggerHaptic]
  );

  const toggleBookmark = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const currentCard = currentCards[currentCardIndex];
      if (!currentCard) return;
      setBookmarkedCards((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(currentCard.id)) {
          newSet.delete(currentCard.id);
        } else {
          newSet.add(currentCard.id);
        }
        return newSet;
      });
      triggerHaptic();
    },
    [currentCardIndex, currentCards, triggerHaptic]
  );

  const handleZoomChange = useCallback(
    (action: "increase" | "decrease" | "reset", e: React.MouseEvent) => {
      e.stopPropagation();
      setZoomLevel((prev) => {
        switch (action) {
          case "increase":
            return Math.min(prev + 0.25, 3);
          case "decrease":
            return Math.max(prev - 0.25, 0.5);
          case "reset":
            return 1;
          default:
            return prev;
        }
      });
    },
    []
  );

  const toggleTimer = useCallback(() => {
    setTimerActive((prev) => !prev);
  }, []);

  const resetStudySession = useCallback(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setCardKey((prev) => prev + 1);
    setShowSummary(false);
    setZoomLevel(1);
    setStudyTime(0);
    swiperRef.current?.slideTo(0, 0);
    setTimerActive(true);
    triggerHaptic();
  }, [triggerHaptic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      imageCache.current.clear();
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
      // Restore theme if component unmounts while in fullscreen
      if (originalTheme !== null) {
        if (originalTheme) {
          document.documentElement.setAttribute("data-theme", originalTheme);
        } else {
          document.documentElement.removeAttribute("data-theme");
        }
        if (originalTheme !== "dark") {
          document.documentElement.classList.remove("dark");
        }
      }
    };
  }, [originalTheme]);

  // Track card view
  useEffect(() => {
    const currentCard = currentCards[currentCardIndex];
    if (currentCard) {
      trackEvent(
        "Flashcard",
        "View Card",
        `Set: ${title} - Card: ${currentCard.cardNumber}`
      );
    }
  }, [currentCardIndex, currentCards, title]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSummary) return;
      if (!swiperRef.current) return;
      switch (e.key) {
        case "ArrowLeft":
          if (!settings.isVertical) {
            swiperRef.current.slidePrev();
          }
          break;
        case "ArrowRight":
          if (!settings.isVertical) {
            swiperRef.current.slideNext();
          }
          break;
        case "ArrowUp":
          if (settings.isVertical) {
            swiperRef.current.slidePrev();
          }
          break;
        case "ArrowDown":
          if (settings.isVertical) {
            swiperRef.current.slideNext();
          }
          break;
        case " ":
          e.preventDefault();
          handleFlip();
          break;
        case "b":
          toggleBookmark();
          break;
        case "r":
          handleZoomChange("reset", {
            stopPropagation: () => {},
          } as React.MouseEvent);
          break;
        case "+":
          handleZoomChange("increase", {
            stopPropagation: () => {},
          } as React.MouseEvent);
          break;
        case "-":
          handleZoomChange("decrease", {
            stopPropagation: () => {},
          } as React.MouseEvent);
          break;
        case "f":
        case "F11":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "Escape":
          if (isFullscreen) {
            toggleFullscreen();
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handleFlip,
    settings.isVertical,
    toggleBookmark,
    handleZoomChange,
    toggleFullscreen,
    isFullscreen,
    showSummary,
  ]);

  const stats = useMemo(() => {
    const total = currentCards.length;
    const bookmarked = bookmarkedCards.size;
    return { total, bookmarked };
  }, [currentCards.length, bookmarkedCards]);

  return (
    <div
      ref={containerRef}
      className={`${
        isFullscreen ? "h-screen" : "h-dvh"
      } bg-background flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`sticky top-0 flex-shrink-0 px-3 pb-1 bg-background/95 backdrop-blur-sm border-b border-border/50 z-20 transition-all duration-300 ${
          isFullscreen ? "py-2" : ""
        }`}
        style={{
          paddingTop: isFullscreen
            ? "0.5rem"
            : "calc(0.75rem + env(safe-area-inset-top, 0px))",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <Button onClick={onBack} variant="outline" size="sm" className="h-9">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-base sm:text-lg font-bold text-center flex-1 mx-2 sm:mx-4 truncate">
            {title}
          </h1>
          <div className="flex items-center gap-1 sm:gap-2">
            <Badge
              variant="secondary"
              className="flex-shrink-0 h-7 px-2 text-xs"
            >
              {currentCardIndex + 1}/{currentCards.length}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTime(studyTime)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-1"
                onClick={toggleTimer}
              >
                {timerActive ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                size="sm"
                className="h-9"
                title={
                  isFullscreen
                    ? "Exit Fullscreen (F or F11)"
                    : "Enter Fullscreen (F or F11)"
                }
              >
                <AnimatePresence mode="wait">
                  {isFullscreen ? (
                    <motion.div
                      key="minimize"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Shrink className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="maximize"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Expand className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Flashcard Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {settings.isVertical ? (
                        <FlipVertical className="h-4 w-4" />
                      ) : (
                        <FlipHorizontal className="h-4 w-4" />
                      )}
                      <Label htmlFor="vertical-mode">Vertical Scrolling</Label>
                    </div>
                    <Switch
                      id="vertical-mode"
                      checked={settings.isVertical}
                      onCheckedChange={(checked) =>
                        handleSettingsChange("isVertical", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shuffle className="h-4 w-4" />
                      <Label htmlFor="randomize">Randomize Cards</Label>
                    </div>
                    <Switch
                      id="randomize"
                      checked={settings.isRandomized}
                      onCheckedChange={(checked) =>
                        handleSettingsChange("isRandomized", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Play className="h-4 w-4" />
                      <Label htmlFor="autoplay">Auto Play</Label>
                    </div>
                    <Switch
                      id="autoplay"
                      checked={settings.autoPlay}
                      onCheckedChange={(checked) =>
                        handleSettingsChange("autoPlay", checked)
                      }
                    />
                  </div>
                  {settings.autoPlay && (
                    <div className="space-y-2">
                      <Label htmlFor="autoplay-speed">
                        Auto Play Speed: {settings.autoPlaySpeed}s
                      </Label>
                      <input
                        id="autoplay-speed"
                        type="range"
                        min="2"
                        max="15"
                        step="1"
                        value={settings.autoPlaySpeed}
                        onChange={(e) =>
                          handleSettingsChange(
                            "autoPlaySpeed",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                    </div>
                  )}
                  {settings.isRandomized && (
                    <div className="pt-2">
                      <Button
                        onClick={randomizeCards}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Shuffle Again
                      </Button>
                    </div>
                  )}
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">
                      Study Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        <span>Total Cards: {stats.total}</span>
                      </div>
                      <div className="flex items-center">
                        <Bookmark className="h-3 w-3 text-blue-500 mr-2" />
                        <span>Bookmarked: {stats.bookmarked}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">
                      Keyboard Shortcuts
                    </h3>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        • <kbd className="px-1 py-0.5 bg-muted rounded">F</kbd>{" "}
                        or{" "}
                        <kbd className="px-1 py-0.5 bg-muted rounded">F11</kbd>{" "}
                        - Toggle Fullscreen
                      </div>
                      <div>
                        •{" "}
                        <kbd className="px-1 py-0.5 bg-muted rounded">
                          Space
                        </kbd>{" "}
                        - Flip Card
                      </div>
                      <div>
                        • <kbd className="px-1 py-0.5 bg-muted rounded">B</kbd>{" "}
                        - Bookmark
                      </div>
                      <div>
                        •{" "}
                        <kbd className="px-1 py-0.5 bg-muted rounded">
                          Arrow Keys
                        </kbd>{" "}
                        - Navigate Cards
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="mb-1">
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground text-center mt-1">
            Progress: {Math.round(progress)}%
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 relative overflow-y-auto flex items-center justify-center ${
          isFullscreen ? "p-4" : "p-2"
        } min-h-0`}
      >
        {showSummary ? (
          <div className="flex flex-col items-center justify-center h-full p-4 w-full max-w-md">
            <div className="bg-card rounded-xl shadow p-5 border border-border w-full">
              <h2 className="text-xl font-bold text-center mb-4">
                Study Session Complete!
              </h2>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                    <span className="font-medium">Total Cards</span>
                  </div>
                  <span className="font-bold">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="flex items-center">
                    <Bookmark className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="font-medium">Bookmarked</span>
                  </div>
                  <span className="font-bold">{stats.bookmarked}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="font-medium">Study Time</span>
                  </div>
                  <span className="font-bold">{formatTime(studyTime)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={resetStudySession}
                  variant="default"
                  className="w-full"
                >
                  <Restart className="h-4 w-4 mr-2" />
                  Restart Session
                </Button>
                <Button onClick={onBack} variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sets
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Swiper
            direction={settings.isVertical ? "vertical" : "horizontal"}
            pagination={{
              clickable: true,
              dynamicBullets: true,
              dynamicMainBullets: 3,
            }}
            modules={[Pagination, Virtual]}
            onSlideChange={handleSlideChange}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            className="w-full h-full"
            spaceBetween={20}
            slidesPerView={1}
            centeredSlides={true}
            touchRatio={isMobile ? 1 : 1.2}
            threshold={8}
            speed={isMobile ? 250 : 300}
            resistance={true}
            resistanceRatio={0.7}
            virtual={{
              enabled: true,
              cache: true,
              addSlidesBefore: 3,
              addSlidesAfter: 3,
            }}
            style={{
              height: settings.isVertical ? "100%" : "auto",
            }}
          >
            {currentCards.map((card, index) => {
              const isBookmarked = bookmarkedCards.has(card.id);

              return (
                <SwiperSlide
                  key={`${card.id}-${cardKey}`}
                  virtualIndex={index}
                  className="flex items-center justify-center px-2"
                  style={{
                    height: settings.isVertical ? "auto" : "100%",
                  }}
                >
                  <FlashcardSlide
                    card={card}
                    index={index}
                    isFlipped={index === currentCardIndex ? isFlipped : false}
                    isBookmarked={isBookmarked}
                    zoomLevel={index === currentCardIndex ? zoomLevel : 1}
                    cardKey={cardKey}
                    isFullscreen={isFullscreen}
                    onFlip={index === currentCardIndex ? handleFlip : () => {}}
                    onBookmarkToggle={toggleBookmark}
                    onZoomChange={handleZoomChange}
                  />
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </div>

      <style>{`
        .card-container {
          transform-style: preserve-3d;
        }

        .card-face {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          -moz-backface-visibility: hidden;
        }

        .swiper {
          width: 100%;
          height: 100%;
        }

        .swiper-slide {
          display: flex;
          justify-content: center;
          align-items: center;
          transform-style: preserve-3d;
        }

        .swiper-pagination {
          position: absolute !important;
          bottom: calc(40px + env(safe-area-inset-bottom)) !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: auto !important;
        }

        .swiper-pagination-bullet {
          background: hsl(var(--primary)) !important;
          opacity: 0.4 !important;
          width: 8px !important;
          height: 8px !important;
          margin: 0 4px !important;
        }

        .swiper-pagination-bullet-active {
          opacity: 1 !important;
        }

        .swiper-vertical .swiper-pagination {
          right: 20px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          left: auto !important;
          width: auto !important;
        }

        .swiper-vertical .swiper-pagination-bullet {
          display: block !important;
          margin: 4px 0 !important;
        }

        @media (max-width: 640px) {
          .swiper-pagination {
            bottom: calc(50px + env(safe-area-inset-bottom)) !important;
          }
          .swiper-vertical .swiper-pagination {
            right: 15px !important;
          }
        }

        /* Fullscreen adjustments */
        :fullscreen .swiper-pagination,
        :-webkit-full-screen .swiper-pagination,
        :-moz-full-screen .swiper-pagination,
        :-ms-fullscreen .swiper-pagination {
          bottom: 40px !important;
        }

        :fullscreen .swiper-vertical .swiper-pagination,
        :-webkit-full-screen .swiper-vertical .swiper-pagination,
        :-moz-full-screen .swiper-vertical .swiper-pagination,
        :-ms-fullscreen .swiper-vertical .swiper-pagination {
          right: 40px !important;
        }

        /* Performance optimizations */
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }

        img {
          pointer-events: none;
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }

        /* Force hardware acceleration */
        .swiper-slide {
          will-change: transform;
          transform: translate3d(0, 0, 0);
        }

        /* Fullscreen styles with dark mode */
        :fullscreen {
          background-color: hsl(var(--background));
        }

        :-webkit-full-screen {
          background-color: hsl(var(--background));
        }

        :-moz-full-screen {
          background-color: hsl(var(--background));
        }

        :-ms-fullscreen {
          background-color: hsl(var(--background));
        }

        /* Image loading optimization */
        img {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: optimize-contrast;
          image-rendering: crisp-edges;
        }
      `}</style>
    </div>
  );
}
