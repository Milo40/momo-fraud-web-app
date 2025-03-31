"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"

const models = [
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  { id: "gpt-4", name: "GPT-4" },
  { id: "claude-v1", name: "Claude v1" },
]

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [selectedModel, setSelectedModel] = useState(models[0].id)
  const [temperature, setTemperature] = useState(0.7)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Select Model</Label>
            <RadioGroup value={selectedModel} onValueChange={setSelectedModel}>
              {models.map((model) => (
                <div key={model.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={model.id} id={model.id} />
                  <Label htmlFor={model.id}>{model.name}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="grid gap-2">
            <Label>Temperature: {temperature.toFixed(1)}</Label>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[temperature]}
              onValueChange={(value) => setTemperature(value[0])}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

