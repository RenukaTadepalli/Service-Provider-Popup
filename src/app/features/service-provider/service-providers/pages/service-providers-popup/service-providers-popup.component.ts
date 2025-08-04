import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ServiceProvidersService } from '../../services/service-providers/service-providers.service';
import { ServiceProvider, ContactDetail } from '../../models/ServiceProvider';

import {
  CountryISO,
  PhoneNumberFormat,
  SearchCountryField,
} from 'ngx-intl-tel-input';

import { ServiceProviderTypesService } from '../../../service-provider-types/services/serviceProvider-types/service-provider-types.service';
import { ToastrService } from '../../../../../shared/component/toastr/services/toastr.service';
import { UserService } from '../../../../users/services/user.service';
import { User } from '../../../../users/models/User';
import { ServiceProviderTypes } from '../../../service-provider-types/models/ServiceProviderTypes';
import { PROVINCES } from '../../../../../constants/provinces.constant';
import { OnChanges, SimpleChanges } from '@angular/core';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

@Component({
  selector: 'app-service-providers-popup',
  standalone: false,
  templateUrl: './service-providers-popup.component.html',
  styleUrls: ['./service-providers-popup.component.css'],
})
export class ServiceProvidersPopupComponent implements OnInit, OnChanges {
  @Input() providerData!: ServiceProvider | null;
  @Input() isEdit = false;
  @Input() isEditMode: boolean = false;
  @Input() users: User[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() formSubmit = new EventEmitter<any>();
  @Input() serviceProviderTypes: ServiceProviderTypes[] = [];

  isVerified = false;
  isAccredited = false;
  toggleOptions = false;
  compareServiceTypes = (a: any, b: any) => a && b && a.id === b.id;

  providerForm!: FormGroup;
  provinces = PROVINCES;

  verifiedByList: { id: number; name: string }[] = [];
  openedByList: { id: number; name: string }[] = [];
  authorisedByList: { id: number; name: string }[] = [];
  accreditedByList: { id: number; name: string }[] = [];
  serviceTypesList: { id: number; name: string }[] = [];

  serviceTypes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private service: ServiceProvidersService,
    private toastr: ToastrService,
    private serviceProviderTypesservice: ServiceProviderTypesService,
    private userService: UserService
  ) {}

  private formatDate(dateStr: string | undefined | null): string | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }

  ngOnInit(): void {
    this.initForm();
    this.loadUsers(); // Populate dropdowns from parent
    this.loadServiceTypes();
    // this.populateServiceTypes(); // Instead of loadServiceTypes()
  }

  /** Initialize Reactive Form */
  private initForm(): void {
    this.providerForm = this.fb.group({
      name: [this.providerData?.Name || '', Validators.required],
      vatNumber: [this.providerData?.VATNumber || '', Validators.required],
      companyRegNo: [
        this.providerData?.CompanyRegNo || '',
        Validators.required,
      ],
      branch: [this.providerData?.Branch || '', Validators.required],
      officeAddress: [
        this.providerData?.OfficeAddress || '',
        Validators.required,
      ],
      storageAddress: [
        this.providerData?.StorageAddress || '',
        Validators.required,
      ],
      townCity: [this.providerData?.TownCity || '', Validators.required],
      province: [this.providerData?.Province || null, Validators.required],

      contactNumbers: this.fb.array(
        this.initContacts(this.providerData?.ContactDetails || [], 'Mobile'),Validators.required
      ),
      faxNumbers: this.fb.array(
        this.initContacts(this.providerData?.ContactDetails || [], 'Fax'),
        Validators.required
      ),
      emailAddresses: this.fb.array(
        this.initEmails(this.providerData?.ContactDetails || []),Validators.required
      ),

      // serviceType: [
      //   this.providerData?.ServiceProviderTypeId || null,
      //   Validators.required,
      // ],

      serviceType: [
        this.getSelectedServiceTypeObject(), // returns object {id, name}
        Validators.required,
      ],

      designationNo: [
        this.providerData?.DesignationNumber || '',
        Validators.required,
      ],
      ratePerKm: [this.providerData?.RatePerKm || '', Validators.required],
      dateAuthorised: [
        this.formatDate(this.providerData?.RateAuthorisedOn) || '',
        Validators.required,
      ],
      authorisedBy: [
        this.providerData?.AuthorisedBy || null,
        Validators.required,
      ],
      canEditAddress: [false],
      isActive: [this.providerData?.IsActive || false],
      dateOpened: [
        this.formatDate(this.providerData?.ActiveOn) || '',
        Validators.required,
      ],
      openedBy: [this.providerData?.ActiveBy || null, Validators.required],
      isVerified: [this.providerData?.IsVerified],
      dateVerified: [
        {
          value: this.formatDate(this.providerData?.VerifiedOn),
          disabled: !this.providerData?.IsVerified,
        },
      ],
      verifiedBy: [
        {
          value: this.providerData?.VerifiedBy || null,
          disabled: !this.providerData?.IsVerified,
        },
      ],
      isAccredited: [this.providerData?.IsAccredited],
      dateAccredited: [
        {
          value: this.formatDate(this.providerData?.AccreditedOn),
          disabled: !this.providerData?.IsAccredited,
        },
      ],
      accreditedBy: [
        {
          value: this.providerData?.AccreditedBy || null,
          disabled: !this.providerData?.IsAccredited,
        },
      ],
    });

    this.isVerified = !!this.providerData?.IsVerified;
    this.isAccredited = !!this.providerData?.IsAccredited;
  }

  private getSelectedServiceTypeObject(): any | null {
    if (!this.providerData?.ServiceProviderTypeId) return null;

    const match = this.serviceTypesList.find(
      (t) => t.id === this.providerData!.ServiceProviderTypeId
    );
    if (match) return match;

    // If it's not in the list (maybe inactive/deleted), still show it
    const selected = this.serviceProviderTypes.find(
      (t) =>
        t.ServiceProviderTypeId === this.providerData?.ServiceProviderTypeId
    );
    return selected
      ? {
          id: selected.ServiceProviderTypeId,
          name: `${selected.Description}`,
        }
      : null;
  }

  /** Populate dropdowns from users list */
  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        const formattedUsers = users
          .filter((u) => u.IsActive && u.AspNetUserId !== undefined)
          .map((u) => ({
            id: u.AspNetUserId!,
            name: `${u.Firstname} ${u.Lastname}`.trim(),
          }));

        this.verifiedByList = formattedUsers;
        this.openedByList = formattedUsers;
        this.authorisedByList = formattedUsers;
        this.accreditedByList = formattedUsers;
      },
    });
    // const formattedUsers = this.users
    //   .filter((u) => u.IsActive && u.AspNetUserId !== undefined)
    //   .map((u) => ({
    //     id: u.AspNetUserId!,
    //     name: `${u.Firstname} ${u.Lastname}`.trim(),
    //   }));

    // this.verifiedByList = formattedUsers;
    // this.openedByList = formattedUsers;
    // this.authorisedByList = formattedUsers;
    // this.accreditedByList = formattedUsers;
  }

  // populateServiceTypes() {
  //   this.serviceTypesList = this.serviceProviderTypes
  //     .filter((type) => type.IsActive && !type.IsDelete)
  //     .map((type) => ({
  //       id: type.ServiceProviderTypeId!,
  //       name: type.Description,
  //     }));

  //   // Include selected type if inactive/deleted
  //   const selectedId = this.providerData?.ServiceProviderTypeId;
  //   const selectedType = this.serviceProviderTypes.find(
  //     (t) => t.ServiceProviderTypeId === selectedId
  //   );
  //   if (selectedType && (!selectedType.IsActive || selectedType.IsDelete)) {
  //     this.serviceTypesList.push({
  //       id: selectedType.ServiceProviderTypeId!,
  //       name: `${selectedType.Description} (Inactive/Deleted)`,
  //     });
  //   }
  // }

  /** Load Service Types */
  loadServiceTypes() {
    this.serviceProviderTypesservice.getAll().subscribe({
      next: (types: ServiceProviderTypes[]) => {
        this.serviceTypesList = types
          .filter((type) => type.IsActive && !type.IsDelete)
          .map((type) => ({
            id: type.ServiceProviderTypeId!,
            name: type.Description!,
          }));

        // Include deleted/inactive type if currently selected
        const selectedId = this.providerData?.ServiceProviderTypeId;
        const selectedType = types.find(
          (type) => type.ServiceProviderTypeId === selectedId
        );
        if (selectedType && (selectedType.IsDelete || !selectedType.IsActive)) {
          this.serviceTypesList.push({
            id: selectedType.ServiceProviderTypeId!,
            name: `${selectedType.Description!} (Deleted)`,
          });
        }
      },
      error: (err) => console.error('Failed to load service types', err),
    });
  }

  onAccreditedToggle() {
    const accredited = this.providerForm.get('isAccredited')?.value;
    this.toggleAccreditedFields(accredited);
  }
  toggleAccreditedFields(accredited: boolean) {
    this.isAccredited = accredited;
    if (accredited) {
      this.providerForm.get('dateAccredited')?.enable();
      this.providerForm.get('accreditedBy')?.enable();
    } else {
      this.providerForm.get('dateAccredited')?.disable();
      this.providerForm.get('accreditedBy')?.disable();
      this.providerForm.get('dateAccredited')?.setValue('');
      this.providerForm.get('accreditedBy')?.setValue(null);
    }
  }

  onVerifiedToggle() {
    const verified = this.providerForm.get('isVerified')?.value;
    this.toggleVerifiedFields(verified);
  }

  toggleVerifiedFields(verified: boolean) {
    this.isVerified = verified;

    if (verified) {
      this.providerForm.get('dateVerified')?.enable();
      this.providerForm.get('verifiedBy')?.enable();
    } else {
      this.providerForm.get('dateVerified')?.disable();
      this.providerForm.get('verifiedBy')?.disable();
      this.providerForm.get('dateVerified')?.setValue('');
      this.providerForm.get('verifiedBy')?.setValue(null);
    }
  }

  get contactNumbers(): FormArray {
    return this.providerForm.get('contactNumbers') as FormArray;
  }

  get faxNumbers(): FormArray {
    return this.providerForm.get('faxNumbers') as FormArray;
  }

  get emailAddresses(): FormArray {
    return this.providerForm.get('emailAddresses') as FormArray;
  }

  private createContactRow(value: any = {}): FormGroup {
    const parsed =
      value.Value && value.Code
        ? parsePhoneNumberFromString(value.Code + value.Value)
        : null;

    return this.fb.group({
      number: [
        parsed
          ? {
              number: parsed.nationalNumber,
              internationalNumber: parsed.formatInternational(),
              nationalNumber: parsed.formatNational(),
              e164Number: parsed.number,
              countryCode: parsed.country,
              dialCode: '+' + parsed.countryCallingCode,
            }
          : '',
      ],
      name: [value.Name || ''],
      comment: [value.Comments || ''],
    });
  }

  private createFaxRow(value: any = {}): FormGroup {
    const parsed =
      value.Value && value.Code
        ? parsePhoneNumberFromString(
            '+' + value.Code.replace('+', '') + value.Value
          )
        : null;

    return this.fb.group({
      fax: [
        parsed
          ? {
              number: parsed.nationalNumber,
              internationalNumber: parsed.formatInternational(),
              nationalNumber: parsed.formatNational(),
              e164Number: parsed.number,
              countryCode: parsed.country, // 'IN' for India
              dialCode: '+' + parsed.countryCallingCode,
            }
          : '',
      ],
      name: [value.Name || ''],
      comment: [value.Comments || ''],
    });
  }

  private createEmailRow(value: any = {}): FormGroup {
    return this.fb.group({
      email: [value.Value || '', [Validators.required, Validators.email]],
      comment: [value.Comments || ''],
    });
  }

  private initContacts(details: ContactDetail[], type: string): FormGroup[] {
    const filtered = details.filter((d) => d.Type === type);
    return filtered.length > 0
      ? filtered.map((c) =>
          type === 'Mobile' ? this.createContactRow(c) : this.createFaxRow(c)
        )
      : [type === 'Mobile' ? this.createContactRow() : this.createFaxRow()];
  }

  private initEmails(details: ContactDetail[]): FormGroup[] {
    const emails = details.filter((d) => d.Type === 'Email');
    return emails.length > 0
      ? emails.map((e) => this.createEmailRow(e))
      : [this.createEmailRow()];
  }

  addContactRow(): void {
    if (this.contactNumbers.length < 5) {
      this.contactNumbers.push(this.createContactRow());
    }
  }

  removeContactRow(index: number): void {
    if (this.contactNumbers.length > 1) {
      this.contactNumbers.removeAt(index);
    }
  }

  addFaxRow(): void {
    if (this.faxNumbers.length < 3) {
      this.faxNumbers.push(this.createFaxRow());
    }
  }

  removeFaxRow(index: number): void {
    if (this.faxNumbers.length > 1) {
      this.faxNumbers.removeAt(index);
    }
  }

  addEmailRow(): void {
    if (this.emailAddresses.length < 2) {
      this.emailAddresses.push(this.createEmailRow());
    }
  }

  removeEmailRow(index: number): void {
    if (this.emailAddresses.length > 1) {
      this.emailAddresses.removeAt(index);
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onCancel(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (!this.providerForm.valid) {
      const invalid = Object.keys(this.providerForm.controls).filter(
        (control) => this.providerForm.get(control)?.invalid
      );
      console.log('Invalid controls:', invalid);
      this.toastr.show('Please fill in all required fields.', 'error');
      this.providerForm.markAllAsTouched();
      return;
    }

    const formData = this.providerForm.getRawValue();
    console.log('📄 Raw form data:', formData);

    const contacts = formData.contactNumbers || [];
    const faxes = formData.faxNumbers || [];
    const emails = formData.emailAddresses || [];

    const contactDetails = this.mapContactDetails(contacts, faxes, emails);
    console.log('📞 Mapped Contact Details:', contactDetails);

    const payload = {
      Name: formData.name?.trim(),
      VATNumber: formData.vatNumber?.trim(),
      CompanyRegNo: formData.companyRegNo?.trim(),
      Branch: formData.branch?.trim(),
      OfficeAddress: formData.officeAddress?.trim(),
      StorageAddress: formData.storageAddress?.trim(),
      TownCity: formData.townCity?.trim(),
      Province: formData.province?.trim(),
      ServiceProviderTypeId: formData.serviceType?.id,
      DesignationNumber: formData.designationNo,
      Manager: 'Thabo Mokoena', // or formData.manager if dynamic
      RatePerKm: Number(formData.ratePerKm),
      AuthorisedBy: formData.authorisedBy,
      IsActive: formData.isActive,
      ActiveBy: formData.openedBy,
      IsVerified: !!formData.isVerified,
      // VerifiedBy: formData.isVerified ? formData.verifiedBy : 0,
      // VerifiedOn: formData.isVerified ? formData.dateVerified : 0,
      VerifiedBy: formData.isVerified ? formData.verifiedBy : 0,
      IsAccredited: !!formData.isAccredited,
      AccreditedBy: formData.isAccredited ? formData.accreditedBy : 0,
      // AccreditedOn: formData.isAccredited ? formData.dateAccredited : 0,
      RateAuthorisedOn: formData.dateAuthorised,
      ActiveOn: formData.dateOpened,
      VerifiedOn: formData.isVerified
        ? formData.dateVerified
        : new Date().toISOString(),
      AccreditedOn: formData.isAccredited
        ? formData.dateAccredited
        : new Date().toISOString(),
      ContactDetails: contactDetails,
      IsDeleted: false,
    };

    console.log('📦 Final Payload to Submit:', payload);

    const request$ =
      this.isEdit && this.providerData?.ServiceProviderId
        ? this.service.updateServiceProvider(
            this.providerData.ServiceProviderId,
            payload
          )
        : this.service.addServiceProvider(payload);

    console.log('📤 Making HTTP Request...');

    request$.subscribe({
      next: (response) => {
        const msg = this.isEdit ? 'updated' : 'added';
        console.log(`✅ Service provider ${msg} successfully!`, response);
        this.toastr.show(`Service provider ${msg} successfully!`, 'success');
        this.formSubmit.emit(payload);
        this.close.emit();
      },
      error: (err) => {
        console.error('❌ Failed to save service provider:', err);
        this.toastr.show('Failed to save service provider', 'error');
      },
    });
  }

  private mapContactDetails(
    contacts: any[],
    faxes: any[],
    emails: any[]
  ): ContactDetail[] {
    const contactList: ContactDetail[] = [];

    contacts.forEach((c) => {
      if (c.number && c.number?.internationalNumber) {
        const dialCode = c.number?.dialCode || '';
        const phoneValue = c.number?.number || '';

        contactList.push({
          Id: 0,
          Type: 'Mobile',
          Code: dialCode,
          Value: phoneValue,
          Name: c.name || '',
          Comments: c.comment || '',
        });
      }
    });

    faxes.forEach((f) => {
      if (f.fax && f.fax?.internationalNumber) {
        const dialCode = f.fax?.dialCode || '';
        const faxValue = f.fax?.number || '';

        contactList.push({
          Id: 0,
          Type: 'Fax',
          Code: dialCode,
          Value: faxValue,
          Name: f.name || '',
          Comments: f.comment || '',
        });
      }
    });

    emails.forEach((e) => {
      if (e.email) {
        contactList.push({
          Id: 0,
          Type: 'Email',
          Code: '',
          Value: e.email,
          Name: '',
          Comments: e.comment || '',
        });
      }
    });

    return contactList;
  }

  // openedByList = [
  //   { id: 1, name: 'Alice Smith' },
  //   { id: 2, name: 'Bob Johnson' },
  // ];
  // verifiedByList = [
  //   { id: 1, name: 'John Smith' },
  //   { id: 2, name: 'Jane Doe' },
  // ];

  // serviceTypeslist = [
  //   { id: 1, name: 'Type A' },
  //   { id: 2, name: 'Type B' },
  //   { id: 3, name: 'Type C' },
  // ];

  separateDialCode = false;
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [
    CountryISO.UnitedStates,
    CountryISO.UnitedKingdom,
  ];
  searchFields = [
    SearchCountryField.Name,
    SearchCountryField.DialCode,
    SearchCountryField.Iso2,
  ];

  getNameById(list: any[], id: number): string {
    const match = list.find((x) => x.id === id);
    return match ? match.name : '';
  }

  //   selectedServiceTypeIsDeleted(): boolean {
  //   const selectedId = this.providerForm.get('serviceType')?.value;
  //   return this.serviceTypesList.some(
  //     (t) => t.id === selectedId && t.IsDeleted
  //   );
  // }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['users'] && changes['users'].currentValue) {
      this.loadUsers(); // Re-run population when users change
    }
  }
}
