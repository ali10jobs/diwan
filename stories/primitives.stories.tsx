import type { Story } from "@ladle/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * One story per shadcn primitive Phase 3 will pull in. Each renders the
 * primitive against the live token stack — pick locale / brand / theme
 * from the Ladle toolbar to see all 8 baseline combinations. Variants
 * within a primitive are laid out in one shot so the RTL + theme
 * correctness is inspectable at a glance.
 */

export const _Button: Story = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
    <Button variant="destructive">Destructive</Button>
    <Button disabled>Disabled</Button>
  </div>
);
_Button.meta = { iframed: false };

export const _Input: Story = () => (
  <div className="flex max-w-md flex-col gap-3">
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="inp-1">Email</Label>
      <Input id="inp-1" type="email" placeholder="you@example.com" />
    </div>
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="inp-2">Disabled</Label>
      <Input id="inp-2" disabled defaultValue="read-only" />
    </div>
  </div>
);

export const _Separator: Story = () => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-4">
      <span>Start</span>
      <Separator orientation="vertical" className="h-5" />
      <span>Middle</span>
      <Separator orientation="vertical" className="h-5" />
      <span>End</span>
    </div>
    <Separator />
    <p className="text-sm text-muted-foreground">Horizontal separator above.</p>
  </div>
);

export const _Tooltip: Story = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>Tooltip content flips with dir.</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const _DropdownMenu: Story = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">Open menu</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-48">
      <DropdownMenuLabel>My account</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Profile</DropdownMenuItem>
      <DropdownMenuItem>Settings</DropdownMenuItem>
      <DropdownMenuItem>Sign out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const _Dialog: Story = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button>Open dialog</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Dialog title</DialogTitle>
        <DialogDescription>
          Close button lives on the inline-end corner — it flips to the left edge in RTL.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button>Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const _SheetStart: Story = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline">Open from start</Button>
    </SheetTrigger>
    <SheetContent side="start">
      <SheetHeader>
        <SheetTitle>Inline-start sheet</SheetTitle>
        <SheetDescription>Opens from the left in LTR and from the right in RTL.</SheetDescription>
      </SheetHeader>
      <SheetFooter>
        <Button>Save</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);

export const _SheetEnd: Story = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline">Open from end</Button>
    </SheetTrigger>
    <SheetContent side="end">
      <SheetHeader>
        <SheetTitle>Inline-end sheet</SheetTitle>
        <SheetDescription>Mirror side of start.</SheetDescription>
      </SheetHeader>
    </SheetContent>
  </Sheet>
);
