import { computed, onMounted, onScopeDispose, reactive, ref, watch, type Ref } from 'vue'
import type { AuthenticatedRequest } from '../lib/api'
import { getNotificationCapabilities, importYouTubeMedia, prepareNotificationImage, uploadNotificationMedia } from '../lib/notificationMedia'
import { isYouTubeDestination, validateNotificationDraft } from '../lib/notificationContent'
import type { NotificationCapabilities, NotificationDraft } from '../types/notification'

export function useNotificationDraft(request: AuthenticatedRequest, identity?: Readonly<Ref<string | null>>) {
  const draft = reactive<NotificationDraft>({ notificationFormat: 'basic', destinationUrl: '', ctaLabel: 'watch_now', mediaUrl: null })
  const capabilities = ref<NotificationCapabilities | null>(null), capabilityError = ref(''), isLoading = ref(false)
  const errors = ref<Record<string, string>>({}), mediaError = ref(''), mediaStatus = ref(''), isMediaBusy = ref(false), uploadProgress = ref(0)
  let capabilityController: AbortController | undefined, mediaController: AbortController | undefined
  let capabilityGeneration = 0, mediaGeneration = 0, isDisposed = false, isMounted = false
  let selectedFile: File | undefined
  let mediaSource: 'upload' | 'youtube' | undefined
  function cancelMedia(): void {
    mediaGeneration++; mediaController?.abort(); isMediaBusy.value = false; mediaStatus.value = ''
  }
  function reset(): void {
    cancelMedia(); selectedFile = undefined; mediaSource = undefined; mediaError.value = ''; errors.value = {}
    Object.assign(draft, { notificationFormat: 'basic', destinationUrl: '', ctaLabel: 'watch_now', mediaUrl: null })
  }
  async function loadCapabilities(): Promise<void> {
    const owner = ++capabilityGeneration
    capabilityController?.abort(); capabilityController = new AbortController()
    capabilities.value = null; isLoading.value = true; capabilityError.value = ''
    try {
      const caps = await getNotificationCapabilities(request, capabilityController.signal)
      if (isDisposed || owner !== capabilityGeneration) return
      capabilities.value = caps
      if (!caps.allowed_formats.includes(draft.notificationFormat)) draft.notificationFormat = caps.allowed_formats[0]!
      if (!caps.cta_presets.some(item => item.value === draft.ctaLabel)) draft.ctaLabel = caps.cta_presets[0]!.value
    } catch {
      if (!isDisposed && owner === capabilityGeneration) capabilityError.value = 'Notification options are unavailable. Load them again before sending.'
    } finally { if (!isDisposed && owner === capabilityGeneration) isLoading.value = false }
  }
  async function processMedia(file?: File): Promise<void> {
    const caps = capabilities.value
    if (!caps || draft.notificationFormat !== 'rich' || isDisposed) return
    cancelMedia(); const owner = mediaGeneration
    const controller = new AbortController(); mediaController = controller
    if (file) selectedFile = file
    mediaSource = file ? 'upload' : 'youtube'; draft.mediaUrl = null
    isMediaBusy.value = true; mediaError.value = ''; uploadProgress.value = 0
    mediaStatus.value = file ? 'Preparing image…' : 'Importing YouTube thumbnail…'
    try {
      let url: string
      if (file) {
        const blob = await prepareNotificationImage(file, caps)
        if (owner !== mediaGeneration || isDisposed) return
        mediaStatus.value = 'Uploading and validating image…'
        url = await uploadNotificationMedia(request, blob, caps, controller.signal, value => { if (owner === mediaGeneration) uploadProgress.value = value })
      } else url = await importYouTubeMedia(request, draft.destinationUrl.trim(), caps, controller.signal)
      if (owner !== mediaGeneration || isDisposed) return
      draft.mediaUrl = url; mediaStatus.value = 'Image ready.'
    } catch (cause) {
      if (owner === mediaGeneration && !isDisposed) { mediaError.value = cause instanceof Error ? cause.message : 'Image unavailable. Retry or send without an image.'; mediaStatus.value = '' }
    } finally { if (owner === mediaGeneration && !isDisposed) isMediaBusy.value = false }
  }
  function removeMedia(): void { cancelMedia(); draft.mediaUrl = null; selectedFile = undefined; mediaSource = undefined; mediaError.value = '' }
  function applyFieldErrors(fields: Record<string, string>): void {
    const names: Record<string, string> = { notification_format: 'notificationFormat', destination_url: 'destinationUrl', cta_label: 'ctaLabel', media_url: 'mediaUrl' }
    for (const [field, message] of Object.entries(fields)) if (names[field]) errors.value[names[field]!] = message
  }
  function validate(): boolean {
    errors.value = validateNotificationDraft(draft, capabilities.value)
    if (isMediaBusy.value) errors.value.mediaUrl = 'Wait for your image or remove it before reviewing.'
    return !Object.keys(errors.value).length
  }
  watch(() => [draft.notificationFormat, draft.destinationUrl, draft.ctaLabel, draft.mediaUrl], () => { errors.value = {} })
  watch(() => draft.notificationFormat, value => { if (value === 'basic') removeMedia() }, { flush: 'sync' })
  watch(() => draft.destinationUrl, () => { if (mediaSource === 'youtube') removeMedia() }, { flush: 'sync' })
  if (identity) watch(identity, () => { reset(); capabilities.value = null; capabilityGeneration++; capabilityController?.abort(); if (isMounted && identity.value) void loadCapabilities() }, { flush: 'sync' })
  onMounted(() => { isMounted = true; if (!identity || identity.value) void loadCapabilities() })
  onScopeDispose(() => { isDisposed = true; capabilityGeneration++; capabilityController?.abort(); cancelMedia(); selectedFile = undefined })
  return { draft, capabilities, capabilityError, isLoading, errors, mediaError, mediaStatus, isMediaBusy, uploadProgress, loadCapabilities, validate, applyFieldErrors, reset,
    selectImage: (file: File) => processMedia(file), importThumbnail: () => processMedia(), retryMedia: () => processMedia(mediaSource === 'upload' ? selectedFile : undefined), removeMedia,
    canImportThumbnail: computed(() => isYouTubeDestination(draft.destinationUrl.trim())) }
}
