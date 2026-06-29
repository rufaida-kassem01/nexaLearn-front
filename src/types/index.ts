// ── API Response Types ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  nextCursor?: string;
  hasMore?: boolean;
  totalUnread?: number;
  reviews?: T[];
}

// ── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface SignupRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  username?: string;
}

// ── Course ──────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  thumbnailUrl?: string;
  basePrice: number;
  isFree: boolean;
  status: string;
  language?: string;
  categoryId?: string;
  instructorId?: string;
  ratingAvg: number;
  totalReviews: number;
  totalEnrollments: number;
  modules: Module[];
  createdAt: string;
  updatedAt: string;
  instructorName?: string;
  instructor?: { id: string; firstName: string; lastName: string };
}

export interface SearchCourseResult {
  id: string;
  title: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  priceInCents?: number;
  basePrice?: number;
  price?: number;
  ratingAvg?: number;
  rating?: number;
  totalReviews?: number;
  totalEnrollments?: number;
  instructorName?: string;
  instructor?: { firstName: string; lastName: string };
  categoryName?: string;
  categoryId?: string;
  isFree?: boolean;
}

export interface Module {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  durationSecs?: number;
  durationSeconds?: number;
  contentUrl?: string;
  contentType: string;
  orderIndex: number;
  isPreview: boolean;
  isPreviewFree?: boolean;
  hasQuiz?: boolean;
  moduleId?: string;
}

export interface CourseContent {
  id: string;
  title: string;
  modules: Module[];
}

// ── Media / Video ───────────────────────────────────────────────────────────

export type VideoAssetStatus =
  | "waiting"
  | "uploading"
  | "uploaded"
  | "processing"
  | "ready"
  | "errored";

export interface VideoAsset {
  id: string;
  courseId: string;
  lessonId?: string;
  status: VideoAssetStatus;
  uploadUrl?: string;
  playbackId?: string;
  durationSecs?: number;
  thumbnailUrl?: string;
  createdAt: string;
  provider?: string;
  failureReason?: string;
}

export interface UploadUrlResponse {
  assetId: string;
  uploadUrl: string;
  expiresAt: string;
}

export interface PlaybackResponse {
  playbackUrl?: string;
  legacyContentUrl?: string;
}

// ── Enrollment ──────────────────────────────────────────────────────────────

export interface Enrollment {
  courseId: string;
  userId: string;
  status: "ACTIVE" | "PENDING" | "CANCELLED" | "REFUNDED";
  enrolledAt: string;
  progressPercent: number;
  lastAccessedLessonId?: string;
}

// ── Progress ────────────────────────────────────────────────────────────────

export interface CourseProgress {
  courseId: string;
  completedLessons: string[];
  progressPercent: number;
}

export interface TrackProgressRequest {
  lessonId: string;
  watchedSeconds: number;
  isCompleted: boolean;
}

export interface ResumeData {
  lastLessonId?: string;
  lastPosition?: number;
}

// ── Certificate ─────────────────────────────────────────────────────────────

export interface Certificate {
  verificationCode: string;
  courseId: string;
  userId: string;
  issuedAt: string;
}

// ── Review ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment?: string;
  title?: string;
  createdAt: string;
  updatedAt?: string;
  user?: { firstName: string; lastName: string };
}

export interface FlagReviewRequest {
  reason: string;
}

// ── Quiz / Assessment ──────────────────────────────────────────────────────

export type QuestionType = "MULTIPLE_CHOICE" | "SINGLE_CHOICE" | "SHORT_ANSWER" | "TRUE_FALSE";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  questionText?: string;
  points?: number;
  orderIndex?: number;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title?: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  maxAttempts: number;
  isPublished: boolean;
  questions: Question[];
  totalMarks?: number;
  timeLimitMins?: number;
}

export interface Attempt {
  id: string;
  lessonId: string;
  status: string;
  score?: number;
  total?: number;
  passed?: boolean;
}

export interface SubmitAnswer {
  questionId: string;
  selectedOptions: number[];
  textAnswer?: string;
}

export interface SubmitAttemptRequest {
  answers: SubmitAnswer[];
}

// ── Discussion ──────────────────────────────────────────────────────────────

export interface Thread {
  id: string;
  lessonId: string;
  title: string;
  body: string;
  authorId: string;
  authorName?: string;
  isPinned: boolean;
  isResolved: boolean;
  postCount: number;
  createdAt: string;
}

export interface Post {
  id: string;
  threadId: string;
  body: string;
  authorId: string;
  authorName?: string;
  isAccepted: boolean;
  createdAt: string;
  upvotes: number;
}

// ── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, string>;
}

// ── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  parentId?: string;
  children?: Category[];
}

// ── Instructor ──────────────────────────────────────────────────────────────

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface InstructorApplication {
  id: string;
  userId: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  createdAt: string;
}

// ── Analytics ───────────────────────────────────────────────────────────────

export interface CourseSummary {
  courseId: string;
  title: string;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
}

export interface LessonEngagement {
  lessonId: string;
  title: string;
  views: number;
  completions: number;
}

export interface RevenueBreakdown {
  year: number;
  months: { month: number; revenue: number }[];
}

export interface QuizStats {
  quizId: string;
  title: string;
  totalAttempts: number;
  passRate: number;
}

export interface InstructorOverview {
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  totalCourses: number;
}

// ── Payment ─────────────────────────────────────────────────────────────────

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface CheckoutResponse {
  checkoutUrl?: string;
  clientSecret?: string;
}

// ── Chat ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Admin ──────────────────────────────────────────────────────────────────

export interface AdminDashboard {
  totalCourses: number;
  totalUsers: number;
  totalInstructors: number;
  totalRevenue: number;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  timestamp: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogInsights {
  totalEntries: number;
  actions: Record<string, number>;
  entityTypes: Record<string, number>;
}

// ── Streak ──────────────────────────────────────────────────────────────────

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
}

// ── Toast ──────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// ── Component Prop Types ───────────────────────────────────────────────────

export interface CourseCardProps {
  course: Course | SearchCourseResult;
}
