import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  RatingQuestion,
  RatingQuestionType,
} from '../../models/rating-questions.model';

import { RatingQuestionTypeService } from '../../../rating-questions-types/services/rating-question-types.service';
import { RatingQuestionService } from '../../services/rating-questions.service';
import { ToastrService } from '../../../../shared/component/toastr/services/toastr.service';

@Component({
  selector: 'app-rating-questions-list-popup',
  standalone: false,
  templateUrl: './rating-questions-list-popup.component.html',
  styleUrl: './rating-questions-list-popup.component.css',
})
export class RatingQuestionsListPopupComponent {
 
}
