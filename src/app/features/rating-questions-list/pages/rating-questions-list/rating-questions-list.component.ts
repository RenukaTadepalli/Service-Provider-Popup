import { Component, OnInit } from '@angular/core';
import {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
} from 'ag-grid-community';
import { RatingQuestion } from '../../models/rating-questions.model';
import { ActiveToggleRendererComponent } from '../../../../shared/component/active-toggle-renderer/active-toggle-renderer.component';
import { SoftDeleteButtonRendererComponent } from '../../../../shared/component/soft-delete-button-renderer/soft-delete-button-renderer.component';
import { ViewButtonRendererComponent } from '../../../../shared/component/view-button-renderer/view-button-renderer.component';
import { ToastrService } from '../../../../shared/component/toastr/services/toastr.service';
import { RatingQuestionService } from '../../services/rating-questions.service';

@Component({
  selector: 'app-rating-questions-list',
  standalone: false,
  templateUrl: './rating-questions-list.component.html',
  styleUrl: './rating-questions-list.component.css',
})
export class RatingQuestionsListComponent implements OnInit {
  ActiveToggleRendererComponent = ActiveToggleRendererComponent;
  SoftDeleteRendererComponent = SoftDeleteButtonRendererComponent;
  ViewButtonRendererComponent = ViewButtonRendererComponent;

  gridApi!: GridApi;
  rowData: RatingQuestion[] = [];

  selectedOption: RatingQuestion | null = null;
  showPopup = false;
  isEditMode = false;

  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
  };

  columnDefs: ColDef<RatingQuestion>[] = [
    {
      field: 'Question',
      headerName: 'Question',
      minWidth: 350,
      cellStyle: { borderRight: '1px solid #ccc' },
      headerClass: 'bold-header',
    },
    {
      headerName: 'Question Type',
      field: 'RatingQuestionType.QuestionType',
      valueGetter: (params) =>
        params.data?.RatingQuestionType?.QuestionType || '—',
      minWidth: 280,
      cellStyle: { textAlign: 'center', borderRight: '1px solid #ccc' },
      headerClass: 'bold-header',
    },
    {
      field: 'ListRank',
      headerName: 'Rank',
      minWidth: 200,
      cellStyle: { textAlign: 'center', borderRight: '1px solid #ccc' },
      headerClass: 'bold-header',
    },
    {
      field: 'IsActive',
      headerName: 'Active',
      minWidth: 250,
      cellRenderer: 'activeToggleRenderer',
      cellRendererParams: (params: ICellRendererParams<RatingQuestion>) => ({
        isDisabled: true,
      }),
      cellStyle: {
        borderRight: '1px solid #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '17px',
      },
      headerClass: 'bold-header',
    },
    {
      suppressHeaderMenuButton: true,
      pinned: 'right',
      sortable: false,
      filter: false,
      flex: 1,
      maxWidth: 90,
      cellRenderer: 'viewButtonRenderer',
      onCellClicked: (params: CellClickedEvent) =>
        this.openEditPopup(params.data),
      cellStyle: {
        borderRight: '1px solid #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '17px',
      },
      headerClass: 'bold-header',
    },
    {
      suppressHeaderMenuButton: true,
      pinned: 'right',
      sortable: false,
      filter: false,
      flex: 1,
      maxWidth: 100,
      cellRenderer: 'softDeleteRenderer',

      cellStyle: {
        borderRight: '1px solid #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      headerClass: 'bold-header',
    },
  ];

  constructor(
    private listservice: RatingQuestionService,
    private toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadAllRatingQuestions();
  }

  loadAllRatingQuestions(): void {
    this.listservice.getAll().subscribe({
      next: (res) => {
        // Filter out deleted questions
        this.rowData = res.filter((q) => !q.IsDeleted);
      },
      error: () => {
        this.toaster.show('Failed to load questions', 'error');
      },
    });
  }

  openEditPopup(option: RatingQuestion): void {
    this.selectedOption = option;
    this.isEditMode = true;
    this.showPopup = true;
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.gridApi.sizeColumnsToFit();
  }
}
