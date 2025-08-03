import type React from "react"
import { useState, useEffect, useRef } from "react"
import jsQR from 'jsqr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Alert, AlertDescription } from "../components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertCircle, Scan, Camera, CameraOff, Upload } from "lucide-react"
import { toast } from "sonner"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

// Define the expected structure of the scan response from your Go backend
interface ScanResponse {
  exists: boolean
  message: string
  ticketId?: string // Optional, as it might not exist if not found
  isUsed?: boolean // Optional, as it might not exist if not found
}

const QRCode: React.FC = () => {
  const [scannedImageText, setScannedImageText] = useState<string>("")
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)
  const [validationMessage, setValidationMessage] = useState<string>("")
  const [loadingScan, setLoadingScan] = useState<boolean>(false)
  const [loadingValidation, setLoadingValidation] = useState<boolean>(false)
  const [cameraPermission, setCameraPermission] = useState<string>("prompt")
  const [cameraError, setCameraError] = useState<string>("")
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [manualInput, setManualInput] = useState<string>("")
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    checkCameraSupport()
    return () => {
      cleanup()
    }
  }, [])

  const checkCameraSupport = async () => {
    try {
      // Check if we're in a secure context (HTTPS or localhost)
      const isSecureContext = window.isSecureContext || 
                              window.location.protocol === 'https:' || 
                              window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1'

      if (!isSecureContext) {
        setCameraError("Camera access requires HTTPS or localhost. Please use manual input or access via localhost.")
        setCameraPermission("not-secure")
        return
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera API not supported in this browser. Please use manual input.")
        setCameraPermission("not-supported")
        return
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length === 0) {
        setCameraError("No camera found on this device. Please use manual input.")
        setCameraPermission("no-camera")
        return
      }

      setCameraPermission("available")
    } catch (error: any) {
      console.error("Camera check error:", error)
      setCameraError("Failed to check camera availability. Please use manual input.")
      setCameraPermission("error")
    }
  }

  const startCamera = async () => {
    try {
      // Additional check before attempting to start camera
      if (cameraPermission !== "available") {
        toast.error("Camera not available. Please use manual input.")
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prefer back camera
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraPermission("granted")
        setCameraError("")
        setIsScanning(true)
        
        // Start scanning after video loads
        videoRef.current.onloadedmetadata = () => {
          startScanning()
        }
      }
    } catch (error: any) {
      console.error("Camera start error:", error)
      if (error.name === 'NotAllowedError') {
        setCameraPermission("denied")
        setCameraError("Camera access denied. Please allow camera permissions or use manual input.")
      } else if (error.name === 'NotFoundError') {
        setCameraError("No camera found on this device. Please use manual input.")
      } else {
        setCameraError("Failed to access camera: " + error.message + ". Please use manual input.")
      }
      toast.error("Camera unavailable. Use manual input below.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
    stopScanning()
  }

  const startScanning = () => {
    if (scanIntervalRef.current) return
    
    scanIntervalRef.current = setInterval(() => {
      scanQRCode()
    }, 500) // Scan every 500ms
  }

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
  }

 const scanQRCode = async () => {
  if (!videoRef.current || !canvasRef.current || loadingScan) return

  const video = videoRef.current
  const canvas = canvasRef.current
  const context = canvas.getContext('2d')

  if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  try {
    // Install and use jsQR for actual QR code detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    
    if (code) {
      setScannedImageText(code.data)
      fetchTicketStatus(code.data)
      stopScanning() // Stop scanning after successful detection
    }
  } catch (error) {
    console.error("QR scan error:", error)
  }
}

  const cleanup = () => {
    stopCamera()
    stopScanning()
  }

  // Function to send the scanned QR code to the backend for initial check
  const fetchTicketStatus = async (qrCodeValue: string) => {
    setLoadingScan(true)
    setValidationMessage("") // Clear previous validation messages
    try {
      const res = await fetch("http://localhost:8080/qrCodeScanning", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ img: qrCodeValue }),
      })

      const data: ScanResponse = await res.json()
      setScanResult(data) // Store the full response

      if (!res.ok) {
        setValidationMessage(data.message || "Error during scan.")
        toast.error(data.message || "Error during scan.")
      } else if (data.exists && data.isUsed) {
        setValidationMessage("Ticket found, but it is already used.")
        toast.warning("Ticket already used")
      } else if (data.exists && !data.isUsed) {
        setValidationMessage("Ticket found and is ready for validation.")
        toast.success("Valid ticket found")
      } else {
        setValidationMessage(data.message)
        toast.error("Ticket not found")
      }
    } catch (error) {
      console.error("Error fetching ticket status:", error)
      setValidationMessage("Failed to connect to the server or process scan.")
      setScanResult(null)
      toast.error("Failed to connect to server")
    } finally {
      setLoadingScan(false)
    }
  }

  // Function to send a request to the backend to validate (mark as used) the ticket
  const handleValidateTicket = async () => {
    if (!scanResult || !scanResult.ticketId) {
      setValidationMessage("No ticket scanned or ID available for validation.")
      toast.error("No ticket available for validation")
      return
    }
    if (scanResult.isUsed) {
      setValidationMessage("Ticket is already used.")
      toast.warning("Ticket already used")
      return
    }

    setLoadingValidation(true)
    setValidationMessage("")

    try {
      const res = await fetch("http://localhost:8080/validateTicket", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ ticketId: scanResult.ticketId }),
      })

      const data = await res.json()

      if (res.ok) {
        setValidationMessage(data.message || "Ticket validated successfully!")
        toast.success("Ticket validated successfully!")
        if (scanResult) {
          setScanResult((prev) => ({ ...prev!, isUsed: true }))
        }
      } else {
        setValidationMessage(data.error || "Failed to validate ticket.")
        toast.error(data.error || "Failed to validate ticket")
      }
    } catch (error) {
      console.error("Error validating ticket:", error)
      setValidationMessage("Failed to connect to the server for validation.")
      toast.error("Failed to connect to server")
    } finally {
      setLoadingValidation(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      setScannedImageText(manualInput.trim())
      fetchTicketStatus(manualInput.trim())
    }
  }

  const getStatusIcon = () => {
    if (!scanResult) return <Scan className="h-5 w-5" />
    if (scanResult.exists && !scanResult.isUsed) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (scanResult.exists && scanResult.isUsed) return <AlertCircle className="h-5 w-5 text-yellow-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = () => {
    if (!scanResult) return null
    if (scanResult.exists && !scanResult.isUsed)
      return (
        <Badge variant="default" className="bg-green-500">
          Valid
        </Badge>
      )
    if (scanResult.exists && scanResult.isUsed) return <Badge variant="secondary">Used</Badge>
    return <Badge variant="destructive">Invalid</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">QR Code Scanner</h1>
          <p className="text-muted-foreground">Scan and validate event tickets</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Scanner Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Scanner
              </CardTitle>
              <CardDescription>Use camera to scan QR codes or enter manually</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Permission Alert */}
              {cameraError && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <CameraOff className="h-4 w-4" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {cameraError}
                    {(cameraPermission === "not-secure" || cameraPermission === "not-supported") && (
                      <div className="mt-2 text-sm">
                        <strong>Tip:</strong> You can still validate tickets using the manual input below.
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Camera Section */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  {!isScanning ? (
                    <Button 
                      onClick={startCamera} 
                      disabled={cameraPermission !== "available"} 
                      className="flex-1"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {cameraPermission === "available" ? "Start Camera" : "Camera Unavailable"}
                    </Button>
                  ) : (
                    <Button onClick={stopCamera} variant="destructive" className="flex-1">
                      <CameraOff className="h-4 w-4 mr-2" />
                      Stop Camera
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-black">
                    <video
                      ref={videoRef}
                      className="w-full h-[300px] object-cover"
                      autoPlay
                      playsInline
                      muted
                      style={{ display: isScanning ? 'block' : 'none' }}
                    />
                    {!isScanning && (
                      <div className="w-full h-[300px] flex items-center justify-center text-white">
                        <div className="text-center">
                          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm opacity-75">Click "Start Camera" to begin scanning</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {loadingScan && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Processing scan...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Input Section - Make it more prominent when camera is unavailable */}
              <div className={`border-t pt-4 ${cameraPermission !== "available" && cameraPermission !== "granted" ? "border-2 border-blue-200 bg-blue-50 dark:bg-blue-950 p-4 rounded-lg" : ""}`}>
                {cameraPermission !== "available" && cameraPermission !== "granted" && (
                  <div className="mb-3">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Use Manual Input
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Camera is not available. Enter the QR code data manually below.
                    </p>
                  </div>
                )}
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <Label htmlFor="manual-input">Manual QR Code Input</Label>
                  <div className="flex gap-2">
                    <Input
                      id="manual-input"
                      value={manualInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualInput(e.target.value)}
                      placeholder="Enter QR code data manually..."
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!manualInput.trim() || loadingScan}>
                      <Upload className="h-4 w-4 mr-2" />
                      Check
                    </Button>
                  </div>
                </form>
              </div>

              {/* Scanned Code Display */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Scanned Code:</p>
                <p className="font-mono text-sm break-all">{scannedImageText || "Waiting for scan..."}</p>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                Ticket Status
              </CardTitle>
              <CardDescription>Validation results and actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scanResult ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      {getStatusBadge()}
                    </div>

                    {scanResult.ticketId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Ticket ID:</span>
                        <span className="font-mono text-sm">{scanResult.ticketId}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Exists:</span>
                      <span className="text-sm">{scanResult.exists ? "Yes" : "No"}</span>
                    </div>

                    {scanResult.isUsed !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Used:</span>
                        <span className="text-sm">{scanResult.isUsed ? "Yes" : "No"}</span>
                      </div>
                    )}
                  </div>

                  {/* Validation Button */}
                  <Button
                    onClick={handleValidateTicket}
                    disabled={!scanResult?.exists || scanResult?.isUsed || loadingValidation}
                    className="w-full"
                    size="lg"
                  >
                    {loadingValidation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Validate Ticket
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Scan className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Scan a QR code to see ticket details</p>
                </div>
              )}

              {/* Status Message */}
              {validationMessage && (
                <Alert
                  className={
                    validationMessage.includes("successfully") || validationMessage.includes("ready for validation")
                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                      : validationMessage.includes("already used")
                        ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
                        : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                  }
                >
                  <AlertDescription
                    className={
                      validationMessage.includes("successfully") || validationMessage.includes("ready for validation")
                        ? "text-green-800 dark:text-green-200"
                        : validationMessage.includes("already used")
                          ? "text-yellow-800 dark:text-yellow-200"
                          : "text-red-800 dark:text-red-200"
                    }
                  >
                    {validationMessage}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default QRCode