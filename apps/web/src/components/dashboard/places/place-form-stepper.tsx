"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type PlaceFormStep = {
  id: string;
  title: string;
  description: string;
};

type PlaceFormStepperProps = {
  steps: PlaceFormStep[];
  currentStep: number;
  onStepSelect: (stepIndex: number) => void;
};

export function PlaceFormStepper({
  steps,
  currentStep,
  onStepSelect,
}: PlaceFormStepperProps) {
  return (
    <ol className="grid gap-3 md:grid-cols-5">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onStepSelect(index)}
              className={cn(
                "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                isActive && "border-primary bg-primary/5",
                isCompleted && "border-emerald-300 bg-emerald-50",
                !isActive && !isCompleted && "border-border bg-background hover:bg-muted/50",
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-emerald-600 text-white",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="text-sm font-semibold text-foreground">{step.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
