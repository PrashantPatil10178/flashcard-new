import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Play, Search, Clock, User, Grid, List } from "lucide-react";
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

export default function FlashcardSetList() {
  const {
    data: flashcardSets = [],
    isLoading: loading,
    error,
  } = useFlashcards();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  useEffect(() => {
    setSelectedSubject("all");
  }, [selectedStandard]);

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
      flashcardSets.filter((set) => {
        const standardMatch =
          selectedStandard === "all" || set.standard === selectedStandard;

        const subjectMatch =
          selectedStandard === "all" || // Don't filter by subject if 'all standards' is selected
          selectedSubject === "all" ||
          set.subject === selectedSubject;

        const searchTermLower = searchTerm.toLowerCase();
        const searchMatch =
          !searchTerm ||
          set.title.toLowerCase().includes(searchTermLower) ||
          set.description.toLowerCase().includes(searchTermLower) ||
          (set.createdByName || "").toLowerCase().includes(searchTermLower);

        return standardMatch && subjectMatch && searchMatch;
      }),
    [flashcardSets, searchTerm, selectedStandard, selectedSubject]
  );

  const getThumbnailUrl = (thumbnailId?: string | null) => {
    return thumbnailId
      ? `https://tools.easylearning.live/uploads/${thumbnailId}`
      : "/placeholder-flashcard.png";
  };

  const handleStudySet = (set: FlashcardSet) => {
    setSelectedSet(set);
    setShowViewer(true);
  };

  const handleBackToList = () => {
    setShowViewer(false);
    setSelectedSet(null);
  };

  const groupedSets = useMemo(() => {
    if (selectedStandard === "all") {
      return {};
    }

    const subjects = getSubjectOptions(selectedStandard);
    const standardInfo = standards.find((s) => s.value === selectedStandard);

    const subjectsWithSets = subjects.reduce((acc, subject) => {
      const setsForSubject = filteredSets.filter(
        (set) => set.subject === subject.value
      );
      if (setsForSubject.length > 0) {
        acc[subject.value] = { label: subject.label, sets: setsForSubject };
      }
      return acc;
    }, {} as Record<string, { label: string; sets: FlashcardSet[] }>);

    if (Object.keys(subjectsWithSets).length > 0 && standardInfo) {
      return {
        [selectedStandard]: {
          label: standardInfo.label,
          subjects: subjectsWithSets,
        },
      };
    }

    return {};
  }, [filteredSets, selectedStandard]);

  if (showViewer && selectedSet) {
    const flashcardData = selectedSet.flashcardsData;
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
        {/* Header */}
        <div className="flex justify-center items-center mb-6 relative">
          <div className="text-center">
            <img
              src="./logo.png"
              alt="EasyLearning Logo"
              className="h-12 w-auto mx-auto mb-2"
            />
            <h1 className="text-2xl md:text-3xl font-bold">
              EasyLearning Flashcards
            </h1>
            <p className="text-muted-foreground">
              Browse and study flashcard sets
            </p>
          </div>
          <div className="absolute right-0 top-0">
            <ModeToggle />
          </div>
        </div>

        {/* Standard Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card
            onClick={() => setSelectedStandard("all")}
            className={`cursor-pointer transition-all duration-200 ${
              selectedStandard === "all"
                ? "bg-primary text-primary-foreground transform scale-105"
                : "hover:bg-muted hover:shadow-lg"
            }`}
          >
            <CardContent className="p-4 text-center flex items-center justify-center h-full">
              <h3 className="font-semibold">All Standards</h3>
            </CardContent>
          </Card>
          {standards.map((standard) => (
            <Card
              key={standard.value}
              onClick={() => setSelectedStandard(standard.value)}
              className={`cursor-pointer transition-all duration-200 ${
                selectedStandard === standard.value
                  ? "bg-primary text-primary-foreground transform scale-105"
                  : "hover:bg-muted hover:shadow-lg"
              }`}
            >
              <CardContent className="p-4 text-center flex items-center justify-center h-full">
                <h3 className="font-semibold">{standard.label}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search flashcards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[180px] justify-between"
                  disabled={selectedStandard === "all"}
                >
                  {selectedSubject === "all"
                    ? "All Subjects"
                    : getSubjectOptions(selectedStandard).find(
                        (s) => s.value === selectedSubject
                      )?.label}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedSubject("all")}>
                  All Subjects
                </DropdownMenuItem>
                {getSubjectOptions(selectedStandard).map((subject) => (
                  <DropdownMenuItem
                    key={subject.value}
                    onClick={() => setSelectedSubject(subject.value)}
                  >
                    {subject.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredSets.length}{" "}
            {filteredSets.length === 1 ? "flashcard set" : "flashcard sets"}{" "}
            found
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
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
              <Card className="text-center py-8">
                <CardContent>
                  <h3 className="text-lg font-semibold mb-2">
                    No flashcard sets found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || selectedStandard !== "all"
                      ? "Try adjusting your search or filters"
                      : "No flashcard sets are available yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Show all sets when "All Standards" is selected */}
                {selectedStandard === "all" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      All Flashcard Sets
                    </h2>
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                          : "space-y-4"
                      }
                    >
                      {filteredSets.map((set: FlashcardSet, index: number) => (
                        <motion.div
                          key={set.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card
                            className={`hover:shadow-md transition-shadow cursor-pointer h-full flex py-0 ${
                              viewMode === "list" ? "flex-row" : "flex-col"
                            } py-0 pb-2`}
                          >
                            <div
                              className={`relative ${
                                viewMode === "list"
                                  ? "w-1/3 aspect-[16/9]"
                                  : "aspect-[16/9]"
                              } overflow-hidden rounded-t-lg ${
                                viewMode === "list"
                                  ? "rounded-l-lg rounded-t-none"
                                  : ""
                              }`}
                            >
                              {set.thumbnailId ? (
                                <LazyLoadImage
                                  src={getThumbnailUrl(set.thumbnailId)}
                                  alt={set.title}
                                  className="w-full h-full object-cover"
                                  effect="blur"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <span className="text-5xl font-bold text-muted-foreground">
                                    {set.title.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="absolute top-2 right-2 flex gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  {set.flashcardCount} cards
                                </Badge>
                                <Badge variant="default" className="text-xs">
                                  {
                                    standards
                                      .find(
                                        (s: { value: string; label: string }) =>
                                          s.value === set.standard
                                      )
                                      ?.label.split(" ")[0]
                                  }
                                </Badge>
                              </div>
                            </div>
                            <CardContent className="p-3 flex-1 flex flex-col">
                              <h3 className="font-semibold text-base mb-1 line-clamp-1">
                                {set.title}
                              </h3>
                              <p className="text-muted-foreground text-xs mb-3 line-clamp-2 flex-1">
                                {set.description || "No description available"}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span className="truncate max-w-[100px]">
                                    {set.createdByName || "EasyLearning"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(set.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-xs">
                                  <Badge variant="outline" className="text-xs">
                                    {
                                      getSubjectOptions(set.standard).find(
                                        (s: { value: string; label: string }) =>
                                          s.value === set.subject
                                      )?.label
                                    }
                                  </Badge>
                                </div>
                                <Button
                                  onClick={() => handleStudySet(set)}
                                  size="sm"
                                  className="h-8 text-xs"
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
                )}

                {/* Show grouped sets when a specific standard is selected */}
                {selectedStandard !== "all" &&
                  Object.entries(groupedSets).map(
                    ([standardValue, standardData]) => (
                      <div key={standardValue}>
                        <h2 className="text-xl font-semibold mb-4">
                          {standardData.label}
                        </h2>
                        <div className="space-y-6">
                          {Object.entries(standardData.subjects).map(
                            ([subjectValue, subjectData]) => (
                              <div key={subjectValue}>
                                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
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
                                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                                        <div
                                          className={`relative ${
                                            viewMode === "list"
                                              ? "w-1/3 aspect-[16/9]"
                                              : "aspect-[16/9]"
                                          } overflow-hidden rounded-t-lg ${
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
                                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                              <span className="text-5xl font-bold text-muted-foreground">
                                                {set.title
                                                  .charAt(0)
                                                  .toUpperCase()}
                                              </span>
                                            </div>
                                          )}
                                          <div className="absolute top-2 right-2">
                                            <Badge
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              {set.flashcardCount} cards
                                            </Badge>
                                          </div>
                                        </div>
                                        <CardContent className="p-3 flex-1 flex flex-col">
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
                                              onClick={() =>
                                                handleStudySet(set)
                                              }
                                              size="sm"
                                              className="h-8 text-xs"
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
