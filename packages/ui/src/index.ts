// Basic components
export { Button } from "./button";
export { Input } from "./input";
export { Spinner } from "./Spinner";

// Layout components
export { Card, CardHeader, CardTitle, CardContent } from "./card";
export { Avatar } from "./avatar";
export { Badge } from "./badge";

// Animation components
export { LottieAnimation } from "./lottie-animation";
export { LoadingAnimation } from "./loading-animation";
export { EmptyState } from "./empty-state";
export { SuccessCelebration } from "./success-celebration";

// Dialog and modal components
export { Modal, ModalTrigger, ModalClose } from "./Modal";
export { BottomSheet } from "./BottomSheet";
export { SheetDialog } from "./SheetDialog";
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog";

// Interactive components
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltip";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
export { Alert, AlertTitle, AlertDescription } from "./alert";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./dropdown-menu";

// Auth-specific components (Villa-specific)
export { AuthCard, type AuthCardProps } from "./AuthCard";
export { AuthError, type AuthErrorProps } from "./AuthError";
export { Skeleton, type SkeletonProps } from "./Skeleton";

// Villa-specific components from ./components/ directory
export { Dialog as VillaDialog, type DialogProps } from "./components/Dialog";
export {
  PasskeyPrompt,
  type PasskeyPromptProps,
} from "./components/PasskeyPrompt";
export { Logo, type LogoProps } from "./components/Logo";

// Theme and utilities
export { colors, spacing } from "./theme/colors";
