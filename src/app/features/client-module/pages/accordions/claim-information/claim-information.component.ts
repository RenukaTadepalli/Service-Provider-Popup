import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TabStateService } from '../../../services/tab-state-service/tab-state.service';

@Component({
  selector: 'app-claim-information',
  standalone: false,
  templateUrl: './claim-information.component.html',
  styleUrl: './claim-information.component.css',
})
export class ClaimInformationComponent implements OnInit {
  editorContent: string = '';
  selectedManager: string = '';
  claimDeclaration = '';
  processClaims = false;
  nearestClaimCentre = false;
  enableDeathClaimVoucher = false;

  claimsManagers = [
    { value: 'manager1', label: 'John Doe' },
    { value: 'manager2', label: 'Jane Smith' },
    { value: 'manager3', label: 'Michael Johnson' },
  ];

  constructor(private tabState: TabStateService) {}

  ngOnInit(): void {
    // Restore state from TabStateService
    this.tabState.getClaimInfo().subscribe((data) => {
      if (data) {
        this.selectedManager = data.ClaimsManager ?? '';
        this.claimDeclaration = data.ClaimFormDeclaration ?? '';
        this.editorContent = data.ClaimFormDeclarationPlain ?? '';
        this.processClaims = data.ProcessClaims ?? false;
        this.nearestClaimCentre = data.NearestClaimCentre ?? false;
        this.enableDeathClaimVoucher =
          data.EnableVoucherExportOnDeathClaim ?? false;
      }
    });
  }

  /**
   * Auto-update claim info in TabStateService when any field changes
   */
  updateClaimState(): void {
    this.tabState.updateClaimInfo({
      ClaimsManager: this.selectedManager,
      ClaimFormDeclaration: this.claimDeclaration,
      ClaimFormDeclarationPlain: this.editorContent,
      ProcessClaims: this.processClaims,
      NearestClaimCentre: this.nearestClaimCentre,
      EnableVoucherExportOnDeathClaim: this.enableDeathClaimVoucher,
    });

    console.log('Claim Information updated in TabState');
  }
}
