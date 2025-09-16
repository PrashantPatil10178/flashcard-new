import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Play, Search, Clock, User, Grid, List, ArrowLeft } from "lucide-react";
import { useFlashcards } from "@/hooks/useFlashcard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { LazyLoadImage } from "react-lazy-load-image-component";
import FlashcardViewer from "@/components/FlashcardViewer";
import "react-lazy-load-image-component/src/effects/blur.css";
import { trackEvent } from "@/lib/analytics";

const standards = [
  { value: "9th", label: "9th (SSC)" },
  { value: "10th", label: "10th (SSC)" },
  { value: "11th-sci", label: "11th Science (HSC)" },
  { value: "12th-sci", label: "12th Science (HSC)" },
];

const sscSubjects = [
  { value: "english", label: "English" },
  { value: "marathi", label: "Marathi" },
  { value: "hindi", label: "Hindi" },
  { value: "maths-1", label: "Mathematics 1 (Algebra)" },
  { value: "maths-2", label: "Mathematics 2 (Geometry)" },
  { value: "science-1", label: "Science 1" },
  { value: "science-2", label: "Science 2" },
  { value: "history-civics", label: "History & Civics" },
  { value: "geography", label: "Geography" },
];

const hscSubjects = [
  { value: "english", label: "English" },
  { value: "marathi", label: "Marathi" },
  { value: "hindi", label: "Hindi" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
  { value: "maths-1", label: "Mathematics 1" },
  { value: "maths-2", label: "Mathematics 2" },
];

interface FlashcardData {
  slideNumber: number;
  imageName: string;
  type: "title" | "front" | "back";
}

interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  thumbnailId: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  published: boolean;
  flashcardsData: FlashcardData[];
  flashcardCount: number;
  standard: string;
  subject: string;
  author: {
    name: string | null;
  };
  thumbnailUrl?: string;
}

interface FlashcardSetListProps {
  standard: string;
  onBack: () => void;
}

export default function FlashcardSetList({
  standard,
  onBack,
}: FlashcardSetListProps) {
  const {
    data: flashcardSets = [],
    isLoading: loading,
    error,
  } = useFlashcards();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  if (error) {
    return <div>Error loading flashcards.</div>;
  }

  const getSubjectOptions = (standard: string) => {
    if (standard === "9th" || standard === "10th") return sscSubjects;
    if (standard === "11th-sci" || standard === "12th-sci") return hscSubjects;
    return [];
  };

  const filteredSets = useMemo(
    () =>
      flashcardSets.filter((set: FlashcardSet) => {
        const standardMatch = set.standard === standard;
        const subjectMatch =
          selectedSubject === "all" || set.subject === selectedSubject;
        const searchTermLower = searchTerm.toLowerCase();
        const searchMatch =
          !searchTerm ||
          set.title.toLowerCase().includes(searchTermLower) ||
          set.description.toLowerCase().includes(searchTermLower) ||
          (set.createdByName || "").toLowerCase().includes(searchTermLower);
        return standardMatch && subjectMatch && searchMatch;
      }),
    [flashcardSets, searchTerm, standard, selectedSubject]
  );

  const getThumbnailUrl = (thumbnailId?: string | null) => {
    return thumbnailId
      ? `https://tools.easylearning.live/uploads/${thumbnailId}`
      : "/placeholder-flashcard.png";
  };

  const handleStudySet = (set: FlashcardSet) => {
    trackEvent("Flashcard Set", "Study Set", set.title);
    setSelectedSet(set);
    setShowViewer(true);
  };

  const handleBackToList = () => {
    setShowViewer(false);
    setSelectedSet(null);
  };

  const groupedSets = useMemo(() => {
    const subjects = getSubjectOptions(standard);
    const standardInfo = standards.find((s) => s.value === standard);
    const subjectsWithSets = subjects.reduce((acc, subject) => {
      const setsForSubject = filteredSets.filter(
        (set: FlashcardSet) => set.subject === subject.value
      );
      if (setsForSubject.length > 0) {
        acc[subject.value] = { label: subject.label, sets: setsForSubject };
      }
      return acc;
    }, {} as Record<string, { label: string; sets: FlashcardSet[] }>);

    if (Object.keys(subjectsWithSets).length > 0 && standardInfo) {
      return {
        [standard]: {
          label: standardInfo.label,
          subjects: subjectsWithSets,
        },
      };
    }
    return {};
  }, [filteredSets, standard]);

  if (showViewer && selectedSet) {
    const flashcardData = selectedSet.flashcardsData.filter(
      (card) => card.type !== "title"
    ) as any;
    return (
      <FlashcardViewer
        flashcardData={flashcardData}
        title={selectedSet.title}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8">
          {/* Back Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">Standards</span>
            <span className="md:hidden">Back</span>
          </Button>

          {/* Logo and Title */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <img
                src="./logo.png"
                alt="EasyLearning Logo"
                className="h-12 w-auto mx-auto"
              />
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-primary rounded-full"></div>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-center">
              {standards.find((s) => s.value === standard)?.label} Flashcards
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block mt-1">
              Browse and study flashcard sets
            </p>
          </div>

          {/* Enhanced Dark/Light Mode Toggle */}
          <div className="flex items-center justify-center">
            <div className="p-1 rounded-full bg-muted shadow-inner">
              <ModeToggle />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search flashcards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-full shadow-sm focus:shadow-md transition-shadow"
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[180px] justify-between rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {selectedSubject === "all"
                    ? "All Subjects"
                    : getSubjectOptions(standard).find(
                        (s) => s.value === selectedSubject
                      )?.label}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedSubject("all")}>
                  All Subjects
                </DropdownMenuItem>
                {getSubjectOptions(standard).map((subject) => (
                  <DropdownMenuItem
                    key={subject.value}
                    onClick={() => setSelectedSubject(subject.value)}
                  >
                    {subject.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex rounded-full bg-muted p-1 shadow-sm border border-border/50">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-l-full rounded-r-none h-8 w-8 p-0 transition-all duration-200"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-r-full rounded-l-none h-8 w-8 p-0 transition-all duration-200"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 px-2">
          <p className="text-sm text-muted-foreground">
            {filteredSets.length}{" "}
            {filteredSets.length === 1 ? "flashcard set" : "flashcard sets"}{" "}
            found
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="h-40 bg-muted rounded-t-lg"></div>
                <CardContent className="p-3">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {filteredSets.length === 0 ? (
              <Card className="text-center py-12 shadow-sm">
                <CardContent>
                  <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No flashcard sets found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm
                      ? "Try adjusting your search or filters"
                      : "No flashcard sets are available yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedSets).map(
                  ([standardValue, standardData]) => (
                    <div key={standardValue}>
                      <div className="space-y-6">
                        {Object.entries(standardData.subjects).map(
                          ([subjectValue, subjectData]) => (
                            <div key={subjectValue}>
                              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                                {subjectData.label}
                              </h3>
                              <div
                                className={
                                  viewMode === "grid"
                                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                    : "space-y-4"
                                }
                              >
                                {subjectData.sets.map((set, index) => (
                                  <motion.div
                                    key={set.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                  >
                                    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col overflow-hidden border border-border/50 hover:border-primary/30 py-0">
                                      <div
                                        className={`relative ${
                                          viewMode === "list"
                                            ? "w-1/3 aspect-[16/9]"
                                            : "aspect-[16/9]"
                                        } overflow-hidden ${
                                          viewMode === "list"
                                            ? "rounded-l-lg rounded-t-none"
                                            : ""
                                        }`}
                                      >
                                        {set.thumbnailId ? (
                                          <LazyLoadImage
                                            src={getThumbnailUrl(
                                              set.thumbnailId
                                            )}
                                            alt={set.title}
                                            className="w-full h-full object-cover"
                                            effect="blur"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                            <span className="text-5xl font-bold text-primary/30">
                                              {set.title
                                                .charAt(0)
                                                .toUpperCase()}
                                            </span>
                                          </div>
                                        )}
                                        <div className="absolute top-2 right-2">
                                          <Badge
                                            variant="secondary"
                                            className="text-xs shadow-sm"
                                          >
                                            {set.flashcardCount} cards
                                          </Badge>
                                        </div>
                                      </div>
                                      <CardContent className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-semibold text-base mb-1 line-clamp-1">
                                          {set.title}
                                        </h3>
                                        <p className="text-muted-foreground text-xs mb-3 line-clamp-2 flex-1">
                                          {set.description ||
                                            "No description available"}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                          <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            <span className="truncate max-w-[100px]">
                                              {set.createdByName ||
                                                "EasyLearning"}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(
                                              set.createdAt
                                            ).toLocaleDateString()}
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-end">
                                          <Button
                                            onClick={() => handleStudySet(set)}
                                            size="sm"
                                            className="h-8 text-xs rounded-full px-4 shadow-sm hover:shadow-md transition-all duration-200"
                                          >
                                            <Play className="h-3 w-3 mr-1" />
                                            Study
                                          </Button>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
