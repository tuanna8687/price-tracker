import {Injectable, signal, computed, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {Observable, BehaviorSubject, tap, catchError, throwError, map} from 'rxjs';
import {User, AuthResponse, LoginRequest, RegisterRequest} from '../models/user.model';
import {ApiResponse} from '../models/api.model';
import {environment} from '../../environments/environment';
import {LocalStorageService} from '../../shared/services/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly localStorage = inject(LocalStorageService);

  // Signals for reactive state management
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public computed signals
  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isAuthenticated = this._isAuthenticated.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();
  public readonly error = this._error.asReadonly();

  // Computed properties
  public readonly userDisplayName = computed(() => {
    const user = this._currentUser();
    if (!user) return '';
    return user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.email;
  });

  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'price_tracker_token';
  private readonly REFRESH_TOKEN_KEY = 'price_tracker_refresh_token';

  constructor() {
    debugger;
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from stored token
   */
  private initializeAuth(): void {
    debugger;
    const token = this.getStoredToken();
    if (token && !this.isTokenExpired(token)) {
      this.setAuthenticationState(true);
      this.loadUserProfile();
    } else {
      this.clearStoredTokens();
    }
  }

  /**
   * Login with email and password
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            this.handleAuthResponse(response.data);
          }
        }),
        map(response => response.data),
        catchError(error => {
          this._error.set(error.error?.message || 'Login failed');
          this._isLoading.set(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.handleAuthResponse(response.data);
          }
        }),
        map(response => response.data),
        catchError(error => {
          this._error.set(error.error?.message || 'Registration failed');
          this._isLoading.set(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Logout user
   */
  logout(): void {
    this.clearStoredTokens();
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    this._error.set(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Load user profile from server
   */
  private loadUserProfile(): void {
    this._isLoading.set(true);

    this.http.get<ApiResponse<User>>(`${environment.apiUrl}/users/profile`)
      .pipe(
        tap(response => {
          if (response.success) {
            this._currentUser.set(response.data);
          }
        }),
        catchError(error => {
          console.error('Failed to load user profile:', error);
          this.logout();
          return throwError(() => error);
        })
      )
      .subscribe(() => {
        this._isLoading.set(false);
      });
  }

  /**
   * Handle successful authentication response
   */
  private handleAuthResponse(authData: AuthResponse): void {
    this.storeTokens(authData.token, authData.refreshToken);
    this._currentUser.set(authData.user);
    this.setAuthenticationState(true);
    this._isLoading.set(false);
    this.router.navigate(['/dashboard']);
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(token: string, refreshToken?: string): void {
    this.localStorage.setItem(this.TOKEN_KEY, token);
    if (refreshToken) {
      this.localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  /**
   * Get stored token
   */
  getStoredToken(): string | null {
    return this.localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Clear stored tokens
   */
  private clearStoredTokens(): void {
    this.localStorage.removeItem(this.TOKEN_KEY);
    this.localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Set authentication state
   */
  private setAuthenticationState(isAuthenticated: boolean): void {
    this._isAuthenticated.set(isAuthenticated);
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/refresh`, {refreshToken})
      .pipe(
        tap(response => {
          if (response.success) {
            this.storeTokens(response.data.token, response.data.refreshToken);
          }
        }),
        map(response => response.data),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }
}
