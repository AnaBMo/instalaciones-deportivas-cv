from django.db import models

class Instalacion(models.Model):
    """
    Modelo para instalaciones deportivas (públicas y privadas)
    """
    # Identificación
    codigo = models.CharField(max_length=50, null=True, blank=True)  # Solo públicas
    nombre = models.CharField(max_length=255)
    
    # Ubicación
    direccion = models.CharField(max_length=500)
    latitud = models.FloatField()
    longitud = models.FloatField()
    cod_postal = models.CharField(max_length=10, null=True, blank=True)
    
    # Geográfica
    cod_provincia = models.CharField(max_length=10, null=True, blank=True)
    denom_provincia = models.CharField(max_length=100, null=True, blank=True)
    cod_municipio = models.CharField(max_length=10, null=True, blank=True)
    denom_municipio = models.CharField(max_length=100, null=True, blank=True)
    
    # Categorización
    tipo = models.CharField(max_length=20, choices=[
        ('publico', 'Público/Municipal'),
        ('privado', 'Privado'),
        ('tienda', 'Tienda'),
        ('camping', 'Camping'),
    ])
    categoria = models.CharField(max_length=255, null=True, blank=True)
    
    # Deportes (para públicas - JSON string)
    deportes = models.TextField(null=True, blank=True)
    
    # Contacto
    telefono = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    
    # Información adicional (privadas)
    rating = models.FloatField(null=True, blank=True)
    total_reviews = models.IntegerField(null=True, blank=True)
    place_id = models.CharField(max_length=255, null=True, blank=True)  # Google Places ID
    
    # Metadata
    anyo_inicio = models.CharField(max_length=10, null=True, blank=True)
    url = models.URLField(max_length=500, null=True, blank=True)
    
    # MongoDB fields
    mongo_id = models.CharField(max_length=50, null=True, blank=True, unique=True)
    
    class Meta:
        db_table = 'instalaciones'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['tipo']),
            models.Index(fields=['denom_municipio']),
            models.Index(fields=['categoria']),
            models.Index(fields=['latitud', 'longitud']),
        ]
    
    def __str__(self):
        return f"{self.nombre} ({self.tipo})"