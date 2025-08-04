// ratingQuestionOptions.ts



export interface RatingQuestionOption {
  RatingQuestionOptionId: number;
  RatingQuestionTypeId: number;
  QuestionOption: string;
  IsNoteRequired: boolean;
  IsActive: boolean;
  DoRaiseFlag: boolean;
  QualifyingPrompt: string;
  RatingValue: number;

  IsDeleted?: boolean;
}
