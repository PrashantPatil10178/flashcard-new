
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

const standards = [
  { value: "9th", label: "9th (SSC)" },
  { value: "10th", label: "10th (SSC)" },
  { value: "11th-sci", label: "11th Science (HSC)" },
  { value: "12th-sci", label: "12th Science (HSC)" },
];

interface StandardProps {
  onSelectStandard: (standard: string) => void;
}

export default function Standard({ onSelectStandard }: StandardProps) {
  const handleSelectStandard = (standard: { value: string; label: string }) => {
    trackEvent("Standard", "Select Standard", standard.label);
    onSelectStandard(standard.value);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <img
          src="./logo.png"
          alt="EasyLearning Logo"
          className="h-16 w-auto mx-auto mb-4"
        />
        <h1 className="text-3xl md:text-4xl font-bold">
          EasyLearning Flashcards
        </h1>
        <p className="text-muted-foreground">
          Select a standard to start learning
        </p>
      </motion.div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl w-full">
        {standards.map((standard, index) => (
          <motion.div
            key={standard.value}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelectStandard(standard)}
            className="cursor-pointer"
          >
            <Card className="transition-all duration-200 hover:bg-muted hover:shadow-lg h-full">
              <CardContent className="p-6 text-center flex items-center justify-center h-full aspect-video">
                <h3 className="font-semibold text-lg">{standard.label}</h3>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
