import axios from "axios";

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      username: string;
      email: string;
    };
  };
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  private storageType: "localStorage" | "sessionStorage" | "memory";
  private memoryToken: string | null = null;
  private baseURL: string;

  constructor() {
    this.baseURL =
      import.meta.env.VITE_NODE_ENV === "production"
        ? import.meta.env.VITE_PROD_BACKEND_URL
        : import.meta.env.VITE_DEV_BACKEND_URL;

    this.storageType = this.detectBestStorage();

    // Initialize axios instance with interceptors
    this.setupAxiosInterceptors();
  }

  private detectBestStorage(): "localStorage" | "sessionStorage" | "memory" {
    // Try localStorage first
    try {
      localStorage.setItem("test", "test");
      localStorage.removeItem("test");
      return "localStorage";
    } catch (e) {
      // If localStorage fails, try sessionStorage
      try {
        sessionStorage.setItem("test", "test");
        sessionStorage.removeItem("test");
        return "sessionStorage";
      } catch (e) {
        // If both fail, use memory storage
        return "memory";
      }
    }
  }

  private setupAxiosInterceptors() {
    axios.interceptors.request.use(
      (config: any) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }
    );
  }

  private setToken(token: string): void {
    switch (this.storageType) {
      case "localStorage":
        localStorage.setItem("token", token);
        break;
      case "sessionStorage":
        sessionStorage.setItem("token", token);
        break;
      case "memory":
        this.memoryToken = token;
        break;
    }
  }

  private getToken(): string | null {
    switch (this.storageType) {
      case "localStorage":
        return localStorage.getItem("token");
      case "sessionStorage":
        return sessionStorage.getItem("token");
      case "memory":
        return this.memoryToken;
      default:
        return null;
    }
  }

  public async register(data: RegisterData) {
    try {
      const response = await axios.post<AuthResponse>(
        `${this.baseURL}/auth/register`,
        data
      );

      if (response.data.success && response.data.data?.token) {
        this.setToken(response.data.data.token);
      }

      return response;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Registration failed");
      }
      throw error;
    }
  }

  public async login(data: LoginData) {
    try {
      const response = await axios.post<AuthResponse>(
        `${this.baseURL}/auth/login`,
        data
      );

      if (response.data.success && response.data.data?.token) {
        this.setToken(response.data.data.token);
      }

      return response;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
      throw error;
    }
  }

  public logout(): void {
    switch (this.storageType) {
      case "localStorage":
        localStorage.removeItem("token");
        break;
      case "sessionStorage":
        sessionStorage.removeItem("token");
        break;
      case "memory":
        this.memoryToken = null;
        break;
    }
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public getStorageType(): string {
    return this.storageType;
  }
}

const authService = new AuthService();
export default authService;
