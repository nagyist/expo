package expo.modules.updates.manifest

import android.util.Log
import expo.modules.jsonutils.require
import expo.modules.structuredheaders.Dictionary
import expo.modules.structuredheaders.StringItem
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.UpdatesDatabase
import org.json.JSONObject

/**
 * Utility methods for reading and writing JSON metadata from manifests (e.g. `serverDefinedHeaders`
 * and `manifestFilters`, both used for rollouts) to and from SQLite.
 */
object ManifestMetadata {
  private val TAG = ManifestMetadata::class.java.simpleName

  private const val EXTRA_CLIENT_PARAMS_KEY = "extraClientParams"
  private const val MANIFEST_SERVER_DEFINED_HEADERS_KEY = "serverDefinedHeaders"
  private const val MANIFEST_FILTERS_KEY = "manifestFilters"

  private fun getJSONObject(
    key: String,
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ): JSONObject? {
    return try {
      val jsonString = database.jsonDataDao()!!
        .loadJSONStringForKey(key, configuration.scopeKey!!)
      if (jsonString != null) JSONObject(jsonString) else null
    } catch (e: Exception) {
      Log.e(TAG, "Error retrieving $key from database", e)
      null
    }
  }

  @JvmStatic fun getServerDefinedHeaders(
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ): JSONObject? {
    return getJSONObject(MANIFEST_SERVER_DEFINED_HEADERS_KEY, database, configuration)
  }

  fun getManifestFilters(
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ): JSONObject? {
    return getJSONObject(MANIFEST_FILTERS_KEY, database, configuration)
  }

  fun getExtraClientParams(
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ): Map<String, String>? {
    return getJSONObject(EXTRA_CLIENT_PARAMS_KEY, database, configuration)?.asStringStringMap()
  }

  fun saveExtraClientParams(
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration,
    extraClientParams: Map<String, String>
  ) {
    // ensure that this can be serialized to a structured-header dictionary
    // this will throw for invalid values
    Dictionary.valueOf(extraClientParams.mapValues { elem -> StringItem.valueOf(elem.value) })

    val extraClientParamsJSONObject = JSONObject(extraClientParams)
    database.jsonDataDao()!!.setMultipleFields(mapOf(EXTRA_CLIENT_PARAMS_KEY to extraClientParamsJSONObject.toString()), configuration.scopeKey!!)
  }

  fun saveMetadata(
    responseHeaderData: ResponseHeaderData,
    database: UpdatesDatabase,
    configuration: UpdatesConfiguration
  ) {
    val fieldsToSet = mutableMapOf<String, String>()
    if (responseHeaderData.serverDefinedHeaders != null) {
      fieldsToSet[MANIFEST_SERVER_DEFINED_HEADERS_KEY] = responseHeaderData.serverDefinedHeaders.toString()
    }
    if (responseHeaderData.manifestFilters != null) {
      fieldsToSet[MANIFEST_FILTERS_KEY] = responseHeaderData.manifestFilters.toString()
    }
    if (fieldsToSet.isNotEmpty()) {
      database.jsonDataDao()!!.setMultipleFields(fieldsToSet, configuration.scopeKey!!)
    }
  }

  private fun JSONObject.asStringStringMap(): Map<String, String> {
    return buildMap {
      this@asStringStringMap.keys().asSequence().forEach { key ->
        this[key] = this@asStringStringMap.require(key)
      }
    }
  }
}
