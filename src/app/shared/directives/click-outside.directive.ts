import { Directive, ElementRef, EventEmitter, HostListener, Output, OnInit } from '@angular/core';

@Directive({
  selector: '[clickOutside]',
  standalone: true
})
export class ClickOutsideDirective implements OnInit {
  @Output() clickOutside = new EventEmitter<void>();

  private isReady = false;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    // Tunggu sebentar sebelum mulai listen
    // supaya klik yang memunculkan elemen ini tidak langsung ter-trigger
    setTimeout(() => {
      this.isReady = true;
    }, 100);
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.isReady) return; // belum siap, abaikan

    const target = event.target as HTMLElement;
    const isInside = this.elementRef.nativeElement.contains(target);
    if (!isInside) {
      this.clickOutside.emit();
    }
  }
}